import { MarketOrderBook,UserBalance,OrderbookOrder } from "./types";
import { validateAndLockBalances } from "./balances";
import { matchOrder } from "./matchingEngine";

export const ORDERBOOK : Record<string,MarketOrderBook> = {
    AXIS : {BIDS :{},ASKS:{}},
    HDFC : {BIDS:{},ASKS:{}}
}
export const BALANCES : Record<number, UserBalance>={
    1:{
    INR: { total: 35000, locked: 10000 },
    AXIS: { total: 20, locked: 0 },
    HDFC: { total: 30, locked: 0 }
    },
    2: {
    INR: { total: 50000, locked: 0 },
    AXIS: { total: 10, locked: 0 },
    HDFC: { total: 0, locked: 0 }
  }
};
let nextOrderId = 1;
interface PlaeOrderInput{
    userId:number;
    stockSymbol:string;
    side: "BUY"|"SELL"
    qty:number;
    price:number;
}

export function placeOrder({userId,stockSymbol,side,qty,price}:PlaeOrderInput){
    if(!ORDERBOOK[stockSymbol]){
        return {success :false,message : "Invalid stock symbol"};
    }
    const isLocked = validateAndLockBalances({userId,stockSymbol,side,qty,price});
    if(!isLocked){
        return {sucees :false,message :"Insufficient funds or assets"};
    }

const newOrder : OrderbookOrder = {
    userId,
    qty,
    filledQty:0,
    orderId:nextOrderId++,
    createdAt :new Date()
};
console.log(` Order #${newOrder.orderId} locked. Sending to matching engine...`);

return { success: true, orderId: newOrder.orderId };
const result = matchOrder(stockSymbol, side, price, newOrder);
return { 
  success: true, 
  orderId: newOrder.orderId, 
  filledFully: result.filledFully, 
  remainingQty: result.remainingQty 
};
}
export function handleInMemorySettlement(
    buyerId :number,
    sellerId : number,
    stockSymbol : string,
    qty : number,
    price : number
){
    const totalCost = qty * price;
    if(BALANCES[buyerId]){
        BALANCES[buyerId]["INR"] -= totalCost;
        if(!BALANCES[buyerId][stockSymbol]){
            BALANCES[buyerId][stockSymbol] = {total :0, locked :0};
        }
        BALANCES[buyerId][stockSymbol].total += qty;
    }
    if(BALANCES[sellerId]){
        BALANCES[sellerId][stockSymbol] -= qty;
        BALANCES[sellerId]["INR"]?.total += totalCost;
    }
}