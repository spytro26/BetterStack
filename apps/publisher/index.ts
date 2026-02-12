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
  //   const ank = await client.xAdd("betterstack:website", "*", {
  //     ankush: "ank",
  //   });

  // 1. Create a pipeline
  const pipeline = client.multi();

  // 2. Queue all commands
  entries.forEach((entry) => {
    pipeline.xAdd("betterstack:website", "*", {
      url: String(entry.url),
      id: String(entry.id),
    });
  });

  // 3. Execute everything at once
  const results = await pipeline.exec();
  console.log(`Successfully synced ${results.length} entries.`);
  client.destroy();
}
main();
