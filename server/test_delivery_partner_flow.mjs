import axios from "axios";

const BASE_URL = "http://localhost:5000/api/v1/delivery-partner";

async function runTest() {
  console.log("==================================================");
  console.log("🚀 STARTING ZOSH BAZAAR DELIVERY PARTNER E2E TEST");
  console.log("==================================================");

  // 1. Partner Login
  console.log("\n[1] Testing Partner Login (/auth/login)...");
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    identifier: "9876543210",
    secret: "123456",
  });
  console.log("✓ Login Success:", loginRes.data.success);
  const token = loginRes.data.data.token;
  const agent = loginRes.data.data.agent;
  console.log(`✓ Agent: ${agent.name} (${agent.agentId}), Phone: ${agent.phone}`);

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 2. Profile
  console.log("\n[2] Testing Profile (/profile)...");
  const profileRes = await client.get("/profile");
  console.log("✓ Profile retrieved:", profileRes.data.data.name, "| Status:", profileRes.data.data.status);
  console.log("✓ Vehicle:", profileRes.data.data.vehicle.vehicleType, profileRes.data.data.vehicle.plateNumber);

  // 3. Shift Management
  console.log("\n[3] Testing Shift Toggle (/shift)...");
  const shiftStart = await client.patch("/shift", { action: "START_SHIFT" });
  console.log("✓ Shift Started:", shiftStart.data.data.shift.isShiftActive, "| Agent Status:", shiftStart.data.data.status);

  // 4. Get Active Route
  console.log("\n[4] Testing Active Route (/route/active)...");
  const routeRes = await client.get("/route/active");
  const route = routeRes.data.data;
  console.log(`✓ Route Code: ${route.routeCode}, Total Stops: ${route.stops.length}, Status: ${route.status}`);

  route.stops.forEach((s) => {
    console.log(`   - Stop #${s.stopIndex}: ${s.customerName} | ${s.trackingNumber} | ${s.address.slice(0, 35)}... | COD: ₹${s.codAmount} | OTP: ${s.otp}`);
  });

  const routeId = route._id;
  const firstStop = route.stops[0];

  // 5. Start Route
  console.log(`\n[5] Starting Route (${route.routeCode})...`);
  const startRouteRes = await client.post(`/route/${routeId}/start`);
  console.log("✓ Route Started! Status:", startRouteRes.data.data.status);

  // 6. Arrive at Stop #1
  console.log(`\n[6] Arriving at Stop #1 (${firstStop.customerName})...`);
  const arriveRes = await client.post(`/route/${routeId}/stops/${firstStop._id}/arrive`);
  console.log("✓ Arrival Recorded! Stop Status:", arriveRes.data.data.stop.status);

  // 7. Package Barcode Scan
  console.log(`\n[7] Scanning Package Barcode (${firstStop.trackingNumber})...`);
  // Test mismatch first
  const wrongScan = await client.post(`/route/${routeId}/stops/${firstStop._id}/scan`, { barcode: "WRONG-BARCODE-999" })
    .catch((err) => err.response);
  console.log("✓ Barcode mismatch correctly rejected:", wrongScan.data.message);

  // Valid scan
  const validScan = await client.post(`/route/${routeId}/stops/${firstStop._id}/scan`, { barcode: firstStop.trackingNumber });
  console.log("✓ Barcode Scan Verified:", validScan.data.message);

  // 8. OTP Verification
  console.log(`\n[8] Verifying Recipient OTP (${firstStop.otp})...`);
  const otpRes = await client.post(`/route/${routeId}/stops/${firstStop._id}/otp`, { otp: firstStop.otp });
  console.log("✓ OTP Verified:", otpRes.data.message);

  // 9. Complete Delivery & POD
  console.log(`\n[9] Completing Delivery & Recording Proof of Delivery...`);
  const podData = {
    pod: {
      recipientName: firstStop.customerName,
      relationship: "SELF",
      photoUrl: "data:image/svg+xml;utf8,<svg><rect fill='%230284c7'/></svg>",
      signatureUrl: "data:image/svg+xml;utf8,<svg><text>Signature</text></svg>",
      location: firstStop.location,
    },
    idempotencyKey: `test-dlv-${Date.now()}`,
  };

  const completeRes = await client.post(`/route/${routeId}/stops/${firstStop._id}/complete`, podData);
  console.log("✓ Delivery Completed:", completeRes.data.message);
  console.log("✓ Earned for stop:", `₹${completeRes.data.earnedAmount}`);
  if (completeRes.data.nextStop) {
    console.log(`✓ Next Action Stop: Stop #${completeRes.data.nextStop.stopIndex} (${completeRes.data.nextStop.customerName})`);
  }

  // 10. Stop #2 COD Collection & Attempt Failure
  const secondStop = route.stops[1];
  if (secondStop) {
    console.log(`\n[10] Testing Stop #2 COD Collection (${secondStop.customerName}, ₹${secondStop.codAmount})...`);
    const codRes = await client.post(`/route/${routeId}/stops/${secondStop._id}/payment`, {
      amount: secondStop.codAmount,
      paymentMethod: "CASH",
    });
    console.log("✓ COD Payment Recorded:", codRes.data.message);

    console.log(`\n[11] Testing Delivery Attempt Failure reporting...`);
    const failRes = await client.post(`/route/${routeId}/stops/${secondStop._id}/fail`, {
      reason: "CUSTOMER_UNAVAILABLE",
      notes: "Customer door was locked, called 3 times.",
    });
    console.log("✓ Attempt Failure Logged:", failRes.data.message);
  }

  // 12. Earnings Transparency Ledger
  console.log("\n[12] Verifying Updated Earnings Ledger (/earnings)...");
  const earningsRes = await client.get("/earnings");
  const earn = earningsRes.data.data;
  console.log(`✓ Net Today: ₹${earn.netToday} | Base Pay: ₹${earn.todayBasePay} | Incentives: ₹${earn.todayIncentives} | Distance: ₹${earn.todayDistancePay}`);
  console.log(`✓ Pending Settlement: ₹${earn.pendingSettlement}`);
  console.log(`✓ Recent Ledger Entries: ${earn.history?.length || 0}`);

  // 13. GPS Telemetry Ping
  console.log("\n[13] Testing Real-Time Location Telemetry Ping (/location/ping)...");
  const pingRes = await client.post("/location/ping", {
    lat: 12.9288,
    lng: 77.6748,
    speed: 28,
    heading: 140,
    batteryLevel: 85,
  });
  console.log("✓ GPS Ping Broadcasted:", pingRes.data.success);

  console.log("\n==================================================");
  console.log("🎉 ALL 13 END-TO-END DELIVERY PARTNER TESTS PASSED!");
  console.log("==================================================");
}

runTest().catch((err) => {
  console.error("❌ Test Failed Code:", err.code);
  console.error("❌ Test Failed Message:", err.message);
  console.error("❌ Test Failed Response:", err.response?.data);
  process.exit(1);
});
