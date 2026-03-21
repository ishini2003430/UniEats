const base = "http://localhost:5000";

const log = (name, ok, details) => {
  console.log(`${ok ? "PASS" : "FAIL"} | ${name} | ${details || ""}`);
};

async function req(path, options = {}) {
  const res = await fetch(base + path, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

async function createVendor(stamp) {
  const email = `vendor_cancel_${stamp}@test.com`;
  const password = "123456";

  await req("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Cancel Vendor",
      email,
      password,
      role: "vendor",
      vendorName: "Cancel Vendor Shop",
      vendorPhone: "0771234567",
      vendorLocation: "Campus",
    }),
  });

  const pending = await req("/api/admin/vendors/pending");
  const vendor = Array.isArray(pending.body) ? pending.body.find((v) => v.email === email) : null;
  if (!vendor) throw new Error("vendor pending not found");

  await req(`/api/admin/vendors/approve/${vendor._id}`, { method: "PUT" });

  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) throw new Error("vendor login failed");
  return login.body;
}

async function createStudent(stamp) {
  const email = `student_cancel_${stamp}@test.com`;
  const password = "123456";

  await req("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Cancel Student",
      email,
      password,
      role: "student",
    }),
  });

  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) throw new Error("student login failed");
  return login.body;
}

(async () => {
  try {
    const stamp = Date.now();
    const vendor = await createVendor(stamp);
    const student = await createStudent(stamp);

    const vendorHeaders = {
      "Content-Type": "application/json",
      "x-user-role": "vendor",
      "x-user-id": vendor._id,
    };

    const studentHeaders = {
      "Content-Type": "application/json",
      "x-user-role": "student",
      "x-user-id": student._id,
    };

    const slotDate = "2026-03-25";
    const slot = await req("/api/slots", {
      method: "POST",
      headers: vendorHeaders,
      body: JSON.stringify({ slotDate, startTime: "12:00", endTime: "12:30", maxCapacity: 2 }),
    });
    if (!slot.ok) throw new Error("slot create failed");

    const food = await req("/api/foods", {
      method: "POST",
      headers: vendorHeaders,
      body: JSON.stringify({ name: "Cancel Test Food", price: 500 }),
    });
    if (!food.ok) throw new Error("food create failed");

    const order = await req("/api/orders", {
      method: "POST",
      headers: studentHeaders,
      body: JSON.stringify({
        studentId: student._id,
        slotId: slot.body._id,
        orderId: `CXL-${stamp}`,
        foodItemIds: [food.body._id],
      }),
    });

    log("Create order", order.ok, `status=${order.status}`);
    if (!order.ok) process.exit(1);

    const orderDocId = order.body.order._id;

    const eligible = await req(`/api/orders/${orderDocId}/cancel-eligibility`, {
      headers: studentHeaders,
    });
    log("Eligibility before cancel", eligible.ok && eligible.body?.canCancel === true, `status=${eligible.status}`);

    const cancel = await req(`/api/orders/${orderDocId}/cancel`, {
      method: "PATCH",
      headers: studentHeaders,
      body: JSON.stringify({ reason: "Change of plan" }),
    });
    log("Cancel pending order", cancel.ok && cancel.body?.order?.status === "Cancelled", `status=${cancel.status}`);

    const eligibilityAfter = await req(`/api/orders/${orderDocId}/cancel-eligibility`, {
      headers: studentHeaders,
    });
    log(
      "Eligibility after cancel blocked",
      eligibilityAfter.status === 200 && eligibilityAfter.body?.canCancel === false && eligibilityAfter.body?.reason === "status_not_pending",
      `status=${eligibilityAfter.status}`
    );

    const cancelAgain = await req(`/api/orders/${orderDocId}/cancel`, {
      method: "PATCH",
      headers: studentHeaders,
      body: JSON.stringify({}),
    });
    log("Second cancel blocked", cancelAgain.status === 422, `status=${cancelAgain.status}`);

    const slotAfter = await req(`/api/slots?id=${slot.body._id}`, {
      headers: { "x-user-role": "vendor", "x-user-id": vendor._id },
    });
    log(
      "Slot count decremented after cancellation",
      slotAfter.ok && slotAfter.body?.currentOrders === 0,
      `status=${slotAfter.status}, currentOrders=${slotAfter.body?.currentOrders}`
    );
  } catch (error) {
    console.error("TEST_ERROR", error.message);
    process.exit(1);
  }
})();
