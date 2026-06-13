export interface OrderbookOrder{
    userId : number;
    qty : number;
    filledQty : number;
    orderId : number;
    createdAt : Date

}
export interface PriceLevel{
    totalQty : number;
    orders : OrderbookOrder[];
}
export interface MarketOrderBook{
    BIDS :Record<number, PriceLevel>;
    ASKS :Record<number, PriceLevel>;
}
export interface UserAssetBalance{
    total: number;
    locked :number;
}

export interface UserBalance{
    [assetTicker : string]:UserAssetBalance
}