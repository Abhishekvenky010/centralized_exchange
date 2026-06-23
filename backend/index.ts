// index.ts
import { MarketOrderbook, UserBalances } from "./types";
import { placeOrder } from "./engine";
import { ORDERBOOK, BALANCES } from "./engine"; // Pulling from engine state

console.log("🚀 Trading Engine Initialized in Bun Environment!");

// --- TEST SIMULATION ---

// Let's print out initial state
console.log("\n--- Initial Balance State ---");
console.log("User 1 INR:", BALANCES[1]?.INR);
console.log("User 2 AXIS Shares:", BALANCES[2]?.AXIS);

// Scenario: User 2 wants to SELL 5 shares of AXIS at ₹200
console.log("\n📥 User 2 places a SELL order: 5 shares of AXIS @ ₹200");
const sellOrderResult = placeOrder({
  userId: 2,
  stockSymbol: "AXIS",
  side: "SELL",
  qty: 5,
  price: 200
});

// Scenario: User 1 wants to BUY 5 shares of AXIS at ₹200 (Matches perfectly!)
console.log("\n📥 User 1 places a BUY order: 5 shares of AXIS @ ₹200");
const buyOrderResult = placeOrder({
  userId: 1,
  stockSymbol: "AXIS",
  side: "BUY",
  qty: 5,
  price: 200
});

// Let's print out the updated state after matching loop completes
setTimeout(() => {
  console.log("\n--- Post-Trade Balance State (RAM) ---");
  console.log("User 1 Updated Balances:", BALANCES[1]);
  console.log("User 2 Updated Balances:", BALANCES[2]);
}, 100); 

// --- OPTIONAL: EXPOSE AN API VIA BUN ---
// This allows you to place orders using curl or Postman!
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/order") {
      try {
        const body = await req.json();
        const result = placeOrder({
          userId: body.userId,
          stockSymbol: body.stockSymbol,
          side: body.side,
          qty: body.qty,
          price: body.price
        });
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }
    }

    return new Response("CEX Matcher Engine Running", { status: 200 });
  },
});

console.log("🌐 Server listening on http://localhost:3000/order");