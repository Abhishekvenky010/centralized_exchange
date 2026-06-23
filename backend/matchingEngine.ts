// matchingEngine.ts
import { ORDERBOOK } from "./engine";
import { OrderbookOrder, PriceLevel } from "./types";
import { handleInMemorySettlement } from "./engine";
import { syncTradeToDatabase } from "./dbsync";

interface MatchResult {
  filledFully: boolean;
  remainingQty: number;
}

export function matchOrder(
  stockSymbol: string, // Changed from String to string
  side: "BUY" | "SELL",
  price: number,
  incomingOrder: OrderbookOrder
): MatchResult {
  const book = ORDERBOOK[stockSymbol];
  let remainingQty = incomingOrder.qty - incomingOrder.filledQty;

  if (side === "BUY") {
    // FIX: Changed book.Asks to book.ASKS
    const askPrices = Object.keys(book.ASKS).map(Number).sort((a, b) => a - b);
    for (const askPrice of askPrices) {
      if (askPrice > price || remainingQty <= 0) break;

      const priceLevel = book.ASKS[askPrice];
      // FIX: Standardized function name casing to processPriceLevelMatch
      remainingQty = processPriceLevelMatch(stockSymbol, priceLevel, incomingOrder, askPrice, remainingQty, side);

      if (priceLevel.orders.length === 0) {
        delete book.ASKS[askPrice];
      }
    }
    if (remainingQty > 0) {
      incomingOrder.filledQty = incomingOrder.qty - remainingQty;
      if (!book.BIDS[price]) {
        book.BIDS[price] = { totalQty: 0, orders: [] };
      }
      book.BIDS[price].orders.push(incomingOrder);
      book.BIDS[price].totalQty += remainingQty;
    }
  } else {
    const bidprices = Object.keys(book.BIDS).map(Number).sort((a, b) => b - a);
    for (const bidPrice of bidprices) {
      if (bidPrice < price || remainingQty <= 0) break;

      const priceLevel = book.BIDS[bidPrice];
      // FIX: Standardized function name casing to processPriceLevelMatch
      remainingQty = processPriceLevelMatch(stockSymbol, priceLevel, incomingOrder, bidPrice, remainingQty, side);
      if (priceLevel.orders.length === 0) {
        delete book.BIDS[bidPrice];
      }
    }
    if (remainingQty > 0) {
      incomingOrder.filledQty = incomingOrder.qty - remainingQty;
      if (!book.ASKS[price]) {
        book.ASKS[price] = { totalQty: 0, orders: [] };
      }
      book.ASKS[price].orders.push(incomingOrder);
      book.ASKS[price].totalQty += remainingQty;
    }
  }
  return {
    filledFully: remainingQty === 0,
    remainingQty
  };
}

// FIX: Corrected function name casing from processPriceLeveLMatch -> processPriceLevelMatch
function processPriceLevelMatch(
  stockSymbol: string,
  priceLevel: PriceLevel,
  incomingOrder: OrderbookOrder,
  executionPrice: number,
  incomingRemainingQty: number,
  side: "BUY" | "SELL" // Added to identify buyer/seller roles
): number {
  let remaining = incomingRemainingQty;
  while (priceLevel.orders.length > 0 && remaining > 0) {
    const restingOrder = priceLevel.orders[0];
    const restingRemainingQty = restingOrder.qty - restingOrder.filledQty;
    const fillQty = Math.min(remaining, restingRemainingQty);

    remaining -= fillQty;
    restingOrder.filledQty += fillQty;
    priceLevel.totalQty -= fillQty;

    console.log(`🎉 MATCH EXECUTED on ${stockSymbol}: ${fillQty} shares @ ₹${executionPrice}`);
    console.log(`   - Incoming Order User: ${incomingOrder.userId}`);
    console.log(`   - Resting Order User: ${restingOrder.userId}`);

    // FIX: Added the missing Step 5 memory settlement and DB synchronization hooks
    const isIncomingBuy = side === "BUY";
    const buyOrderId = isIncomingBuy ? incomingOrder.orderId : restingOrder.orderId;
    const sellOrderId = isIncomingBuy ? restingOrder.orderId : incomingOrder.orderId;
    const buyerUserId = isIncomingBuy ? incomingOrder.userId : restingOrder.userId;
    const sellerUserId = isIncomingBuy ? restingOrder.userId : incomingOrder.userId;

    // Instant RAM balance update
    handleInMemorySettlement(buyerUserId, sellerUserId, stockSymbol, fillQty, executionPrice);

    // Asynchronous background DB write
    syncTradeToDatabase({
      stockSymbol,
      price: executionPrice,
      qty: fillQty,
      buyOrderId,
      sellOrderId,
      incomingOrderRemainingQty: remaining,
      restingOrderRemainingQty: restingOrder.qty - restingOrder.filledQty
    });

    if (restingOrder.filledQty === restingOrder.qty) {
      priceLevel.orders.shift();
    }
  }
  return remaining;
}