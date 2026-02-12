import { createClient } from "redis";
import { prismaClient } from "@repo/db/client";
import "dotenv/config";

async function main() {
  const entries = await prismaClient.website.findMany({
    where: {},
    select: {
      url: true,
      id: true,
    },
  });

  const client = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  await client.del("betterstack:website");
  await client.xAdd("betterstack:website", "*", { init: "true" });

  // Recreate the group so workers don't crash
  try {
    await client.xGroupCreate("betterstack:website", "india", "$");
    // await client.xGroupCreate("betterstack:website", "india", "$");
  } catch (e) {
    // Group might already exist if del failed or logic changed
    console.log(e);
  }
 
  const pipeline = client.multi();

  entries.forEach((entry) => {
    pipeline.xAdd("betterstack:website", "*", {
      url: String(entry.url),
      id: String(entry.id),
    });
  });

  const results = await pipeline.exec();
  console.log(`Successfully synced ${results.length} entries.`);
  
}
main();
setInterval(main, 180000);
