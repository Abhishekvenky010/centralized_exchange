import { BALANCES } from "./engine";
interface LockBalanceInput{
    userId : number;
    stockSymbol : string;
    side : "BUY" | "SELL";
    qty : number;
    price :number;
}

export function validateAndLockBalances({
    userId,
    stockSymbol,
    side,
    qty,
    price,
}:LockBalanceInput):boolean{
    const userBalance= BALANCES[userId];
    if(!userBalance){
        console.log(`User ${userId} not found in memory.`);
        return false;
    }

    if (side == "BUY"){
        const requiredFunds = qty * price;
        const inrAsset = userBalance["INR"];

        if(!inrAsset || inrAsset.total < requiredFunds){
            console.error(`User ${userId} has insufficient INR. Required: ${requiredFunds}`);
            return false;
        }
        inrAsset.total -= requiredFunds;
        inrAsset.locked += requiredFunds;
        return true;
    }else{
        const stockAsset = userBalance[stockSymbol];
        if(!stockAsset || stockAsset.total < qty){
            console.error(`User ${userId} has insufficient shares of ${stockSymbol}. Required: ${qty}`);
            return false;
        }
        stockAsset.total -= qty;
        stockAsset.locked += qty;
        return true;
    }
}