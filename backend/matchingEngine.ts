import { ORDERBOOK,BALANCES } from "./engine";
import { OrderbookOrder,PriceLevel } from "./types";

interface MatchResult{
    filledFully :boolean;
    remainingQty : number;
}
export function matchOrder(
    stockSymbol : String,
    side : "BUY" | "SELL",
    price : number,
    incomingOrder : OrderbookOrder
) : MatchResult {
  const book = ORDERBOOK[stockSymbol];
  let remainingQty = incomingOrder.qty - incomingOrder.filledQty;
  if(side === "BUY"){
    const askPrices = Object.keys(book.Asks).map(Number).sort((a,b)=>a-b);
    for(const askPrice of askPrices){
      if(askPrice > price || remainingQty <= 0) break;

      const priceLevel = book.ASKS[askPrice];
      remainingQty = processPriceLevelMatch(stockSymbol, priceLevel, incomingOrder, askPrice, remainingQty);

      if(priceLevel.orders.length === 0){
          delete book.ASKS[askPrice];
      }
  }
  if(remainingQty > 0){
    incomingOrder.filledQty = incomingOrder.qty - remainingQty;
    if(!book.BIDS[price]){
      book.BIDS[price] = {totalQty: 0, orders: []};
    }
    book.BIDS[price].orders.push(incomingOrder);
    book.BIDS[price].totalQty += remainingQty;
  }
}
}