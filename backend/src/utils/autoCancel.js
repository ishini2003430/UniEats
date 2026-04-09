const mongoose = require('mongoose');
const Order = require('../models/order-n-cancellation/Order');
const PickupSlot = require('../models/order-n-cancellation/PickupSlot');
const Notification = require('../models/order-n-cancellation/Notification');
const User = require('../models/User');
const { emitToUser } = require('./socket');
const { sendEmail } = require('./mailer');
const { buildStudentOrderStatusUpdateEmail } = require('./emailTemplates');

const DEFAULT_MINUTES = Number(process.env.ORDER_AUTO_CANCEL_MINUTES || 10);
const POLL_INTERVAL_MS = 60 * 1000; // check every minute

const formatSlotLabel = (slot) => {
  if (!slot) return 'N/A';
  const datePart = new Date(slot.slotDate).toISOString().slice(0, 10);
  return `${datePart} ${slot.startTime}-${slot.endTime}`;
};

const startAutoCancelMonitor = () => {
  let timer = null;

  const checkOnce = async () => {
    try {
      const cutoff = new Date(Date.now() - DEFAULT_MINUTES * 60 * 1000);

      // find pending orders created before cutoff
      const orders = await Order.find({ status: 'Pending', createdAt: { $lte: cutoff } });
      if (!orders || !orders.length) return;

      for (const order of orders) {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            // mark order cancelled
            order.status = 'Cancelled';
            order.cancelledAt = new Date();
            order.cancelReason = 'Auto-cancel: no vendor response';

            if (Array.isArray(order.vendorOrders) && order.vendorOrders.length) {
              order.vendorOrders = order.vendorOrders.map((vo) => ({
                ...vo.toObject ? vo.toObject() : vo,
                status: 'Cancelled',
                cancelledAt: new Date(),
                cancelReason: 'Auto-cancel: no vendor response',
              }));
            }

            await order.save({ session });

            // decrement pickup slot counts
            const vendorOrders = Array.isArray(order.vendorOrders) ? order.vendorOrders : [];
            for (const vo of vendorOrders) {
              if (!vo.slotId) continue;
              await PickupSlot.updateOne(
                { _id: vo.slotId, currentOrders: { $gt: 0 } },
                { $inc: { currentOrders: -1 } },
                { session }
              );
            }

            // notify student
            const student = await User.findById(order.studentId).select('name email');
            const studentLabel = student?.name || 'Student';

            // fetch pickup slots referenced by vendorOrders (if any) so we can format labels
            const slotIds = vendorOrders.filter((v) => v && v.slotId).map((v) => v.slotId);
            let slotsMap = {};
            if (slotIds.length) {
              const slots = await PickupSlot.find({ _id: { $in: slotIds } }).session(session);
              slotsMap = slots.reduce((acc, s) => {
                acc[s._id.toString()] = s;
                return acc;
              }, {});
            }

            const summaryLines = vendorOrders.map((ctx, idx) => {
              const slotObj = ctx && ctx.slotId ? slotsMap[ctx.slotId.toString()] : null;
              const slotLabel = slotObj ? formatSlotLabel(slotObj) : 'N/A';
              const foodNames = Array.isArray(ctx.foodItemIds) ? ctx.foodItemIds.join(', ') : 'N/A';
              return `${idx + 1}. Items: ${foodNames} | Slot: ${slotLabel}`;
            });

            // vendorId is optional for student-targeted notifications; use first vendorId if available
            const firstVendorId = vendorOrders && vendorOrders[0] ? vendorOrders[0].vendorId : undefined;

            const notification = await Notification.create([
              {
                recipientRole: 'student',
                recipientId: order.studentId,
                vendorId: firstVendorId,
                studentId: order.studentId,
                orderId: order._id,
                type: 'ORDER_STATUS_UPDATED',
                title: 'Order auto-cancelled',
                message: `Order ${order.orderId} was automatically cancelled after ${DEFAULT_MINUTES} minutes without vendor response.\n\n${summaryLines.join('\n')}`,
              },
            ], { session });

            // emit to student
            emitToUser({ role: 'student', userId: order.studentId, event: 'notification:new', payload: notification[0] });

            // send email (best-effort)
            try {
              const studentEmail = buildStudentOrderStatusUpdateEmail({
                studentLabel,
                orderId: order.orderId,
                vendorLabel: 'Multiple',
                nextStatus: 'Cancelled',
                slotLabel: 'N/A',
                foodNames: summaryLines.join('; '),
                statusHeadline: 'Order Cancelled',
                statusSubtitle: 'Automatically cancelled',
                statusMessage: `Your order was cancelled because vendors did not respond within ${DEFAULT_MINUTES} minutes.`,
              });

              await sendEmail({
                to: student?.email,
                subject: `UniEats: Order ${order.orderId} cancelled`,
                text: studentEmail.text,
                html: studentEmail.html,
              });
            } catch (err) {
              console.error('auto-cancel: failed to send student email', err);
            }
          });
        } catch (err) {
          console.error('auto-cancel transaction failed for order', order._id, err);
        } finally {
          await session.endSession();
        }
      }
    } catch (err) {
      console.error('auto-cancel monitor error:', err);
    }
  };

  timer = setInterval(checkOnce, POLL_INTERVAL_MS);

  // run immediately once
  checkOnce().catch((e) => console.error('auto-cancel initial run failed', e));

  return () => {
    if (timer) clearInterval(timer);
  };
};

module.exports = { startAutoCancelMonitor };
