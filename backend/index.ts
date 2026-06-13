import { MarketOrderBook,UserBalance } from "./types";
export const ORDERBOOK:Record<string,MarketOrderBook> = {
  AXIS: { BIDS: {}, ASKS: {} },
  HDFC: { BIDS: {}, ASKS: {} }
}
export const BALANCES: Record<number, UserBalance> = {
  1: {
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