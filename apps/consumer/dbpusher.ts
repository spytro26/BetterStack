import { createClient } from "redis";
import { prismaClient } from "@repo/db/client";
import "dotenv/config";

async function main () {
 const client = await createClient()
   .on("error", (err) => console.log("Redis Client Error", err))
   .connect();


   // fix this 

   const start = '0';
        console.log("jlsl");
   const response = await client.xRead(
     {
       key: "betterstack:db",
       id: start, // '0' means start from the beginning of time
     },
     {
       COUNT: 10,
       BLOCK: 0, // 0 means wait indefinitely until a new message arrives
     },
   );
   console.log("started");


   if (response) {
     // response is an array of streams
     // @ts-ignore
     const messages = response[0].messages;
     const usersToCreate : any  = [];
     messages.forEach((msg : any ) => {
       console.log(`ID: ${msg.message.id}, Data:`, msg.message.url);
       usersToCreate.push({
         reponseTime_ms  : msg.message.responseTime_ms ,
         status : msg.message.status,
         website_id : msg.message.website_id,
         region_id : msg.message.region_id 

       });
     });

      try {
        const batchPayload = await prismaClient.user.createMany({
          data: usersToCreate,
          skipDuplicates: true, // Optional: set to true to ignore unique constraint errors
        });

        console.log(`Created ${batchPayload.count} users`);
      } catch (e) {
        console.error("Error creating users:", e);
      }


   }
}
 
main();
// we need to get all thos from there and then read to the db 





// that is not pushing here 
// not able to create the user.Createmany 
// fix the start 
// fix the frotnend





