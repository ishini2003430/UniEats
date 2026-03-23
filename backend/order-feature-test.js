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

async function registerAndActivateVendor(stamp) {
  const email = `vendor_order_${stamp}@test.com`;
  const password = "123456";

  const reg = await req("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Order Vendor",
      email,
      password,
      role: "vendor",
      vendorName: "Order Vendor Shop",
      vendorPhone: "0771234567",
      vendorLocation: "Campus",
    }),
  });
  if (!reg.ok) {
    throw new Error(`Vendor register failed: ${reg.status}`);
  }

  const pending = await req("/api/admin/vendors/pending");
  const vendor = Array.isArray(pending.body) ? pending.body.find((v) => v.email === email) : null;
  if (!vendor) {
    throw new Error("New vendor not found in pending list");
  }

  const approve = await req(`/api/admin/vendors/approve/${vendor._id}`, { method: "PUT" });
  if (!approve.ok) {
    throw new Error(`Vendor approve failed: ${approve.status}`);
  }

  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) {
    throw new Error(`Vendor login failed: ${login.status}`);
  }

  return login.body;
}

async function registerStudent(stamp) {
  const email = `student_order_${stamp}@test.com`;
  const password = "123456";

  const reg = await req("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Order Student",
      email,
      password,
      role: "student",
    }),
  });

  if (!reg.ok) {
    throw new Error(`Student register failed: ${reg.status}`);
  }

  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) {
    throw new Error(`Student login failed: ${login.status}`);
  }

  return login.body;
}

(async () => {
  try {
    const stamp = Date.now();
    const vendor = await registerAndActivateVendor(stamp);
    const student = await registerStudent(stamp);

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

    const slotDate = "2026-03-24";
    const slot = await req("/api/slots", {
      method: "POST",
      headers: vendorHeaders,
      body: JSON.stringify({ slotDate, startTime: "11:00", endTime: "11:30", maxCapacity: 1 }),
    });
    log("Create slot", slot.ok, `status=${slot.status}`);
    if (!slot.ok) process.exit(1);

    const food = await req("/api/foods", {
      method: "POST",
      headers: vendorHeaders,
      body: JSON.stringify({ name: "Test Rice", price: 450 }),
    });
    log("Create dummy food", food.ok, `status=${food.status}`);
    if (!food.ok) process.exit(1);

    const orderId1 = `ORD-${stamp}-1`;
    const order1 = await req("/api/orders", {
      method: "POST",
      headers: studentHeaders,
      body: JSON.stringify({
        studentId: student._id,
        slotId: slot.body._id,
        orderId: orderId1,
        foodItemIds: [food.body._id],
      }),
    });
    log("Create order", order1.ok, `status=${order1.status}`);
    if (!order1.ok) {
      console.log("DETAIL", JSON.stringify(order1.body));
      process.exit(1);
    }

    const slotAfter1 = await req(`/api/slots?id=${slot.body._id}`, {
      headers: { "x-user-role": "vendor", "x-user-id": vendor._id },
    });
    const slotCountOk = slotAfter1.ok && slotAfter1.body && slotAfter1.body.currentOrders === 1;
    log("Slot count incremented", slotCountOk, `status=${slotAfter1.status}, currentOrders=${slotAfter1.body?.currentOrders}`);

    const orderId2 = `ORD-${stamp}-2`;
    const order2 = await req("/api/orders", {
      method: "POST",
      headers: studentHeaders,
      body: JSON.stringify({
        studentId: student._id,
        slotId: slot.body._id,
        orderId: orderId2,
        foodItemIds: [food.body._id],
      }),
    });

    log("Second order blocked when slot full", order2.status === 409, `status=${order2.status}`);

    const queryOrder = await req(`/api/orders?orderId=${encodeURIComponent(orderId1)}`, {
      headers: { "x-user-role": "student", "x-user-id": student._id },
    });
    log("Query own order", queryOrder.ok && queryOrder.body?.orderId === orderId1, `status=${queryOrder.status}`);
  } catch (error) {
    console.error("TEST_ERROR", error.message);
    process.exit(1);
  }
})();
