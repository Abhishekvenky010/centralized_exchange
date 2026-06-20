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
else{
   const bidprices = Object.keys(book.BIDS).map(Number).sort((a,b)=>b-a);
   for(const bidPrice of bidprices){
    if (bidPrice < price || remainingQty <= 0 )break;

    const priceLevel = book.BIDS[bidPrice];
    remainingQty  = processPriceLevelMatch(stockSymbol, priceLevel, incomingOrder, bidPrice, remainingQty);
    if(priceLevel.orders.length === 0){
       delete book.BIDS[bidPrice];
    }
   }
   if(remainingQty > 0){
    incomingOrder.filledQty = incomingOrder.qty - remainingQty;
     if(!book.ASKS[price]){
       book.ASKS[price] = {totalQty:0,orders:[]};
     }
     book.ASKS[price].orders.push(incomingOrder);
     book.ASKS[price].totalQty += remainingQty;
   }
}
return{
  filledFully: remainingQty === 0,
    remainingQty
};
}
function processPriceLeveLMatch(
  stockSymbol :string,
  priceLevel : PriceLevel,
  incomingOrder: OrderbookOrder,
  executionPrice: number,
  incomingRemainingQty: number
):number{
   let remaining  = incomingRemainingQty;
   while(priceLevel.orders.length > 0 && remaining > 0){
    const restingOrder  = priceLevel.orders[0];
    const restingRemainingQty  = restingOrder.qty - restingOrder.filledQty;
    const fillQty = Math.min(remaining,restingRemainingQty);
    remaining -= fillQty;
    restingOrder.filledQty += fillQty;
    priceLevel.totalQty -= fillQty;

    console.log(`🎉 MATCH EXECUTED on ${stockSymbol}: ${fillQty} shares @ ₹${executionPrice}`);
    console.log(`   - Incoming Order User: ${incomingOrder.userId}`);
    console.log(`   - Resting Order User: ${restingOrder.userId}`);

    if (restingOrder.filledQty === restingOrder.qty) {
      priceLevel.orders.shift(); 
    }
   }
   return remaining;
}