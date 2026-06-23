import {PrismaClient} from "@prisma/client";
const prisma = PrismaClient();
interface DbSyncInput{
    stockSymbol : string;
    price : number;
    qty : number;
    buyOrderId : number;
    sellOrderId : number;
    incomingOrderRemainingQty: number;
    restingOrderRemainingQty: number;

}

export async function syncTradeToDatabase(data:DbSyncInput) {
    try{
        await prisma.$transaction(async (tx)=>{
            const stock = await tx.stock.findUnique({
                where : { symbol : data.stockSymbol},
            });
            if(!stock) throw new Error(`Stock ${data.stockSymbol} not found in DB`);

        await tx.fil.create({
             data:{
                stockId: stock.id,
          price: data.price,
          qty: data.qty,
          buyOrderId: data.buyOrderId,
          sellOrderId: data.sellOrderId,
             },
        });
        
        const incomingStatus = data.incomingOrderRemainingQty === 0 ? "FILLED" : "PARTIALLY FILLED";
        await tx.order.update({
            where : {id : data.buyOrderId},
            data:{
                status : incomingStatus,
                filledQty : { increment : data.qty}
            }
        });
    });
console.log(`💾 DB Synced: Saved match for ${data.stockSymbol} successfully.`);
  } catch (error) {
    console.error("❌ Database sync failed:", error);
    // In production, failed syncs are pushed to a Dead Letter Queue (DLQ) or Kafka for retries
  }
}