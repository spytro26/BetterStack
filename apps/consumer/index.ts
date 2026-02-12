import { createClient } from "redis";
import "dotenv/config";
import axios from "axios"
 async function main () {
const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();
   const pipeline = client.multi();



   // this is consumer \
   while (true){
    console.log("started");
    const response  : any = await  client.xReadGroup(
      "india",  // this is group 
      "1", // this is woekr 
      [
        {
          key: "betterstack:website",
          id: ">", // '>' means "give me new messages never delivered to anyone else"
        },
      ],
      {
        COUNT: 10, // Read 1 message at a time
        BLOCK: 5000, // Wait 5 seconds for a message if the stream is empty
      },
    );

    if (response) {
      // Response structure: [{ name: 'streamName', messages: [{ id: '...', data: {...} }] }]
      const messages = response[0]?.messages;

      for (const message of messages) {
        console.log(
          `Processing Website ID: ${message.message.id} - URL: ${message.message.url}`,
        );
        let before = Date.now();
        try {

        
        const fe  = await axios.get(message.message.url);
        const responseTime = Date.now() - before;
        if(fe.status < 400){
            pipeline.xAdd("betterstack:db", "*", {
              region_id: "3d9ac87b-18e9-4eaa-8f91-1816a00099ec",
              website_id: message.message.id,
              status: "UP",
              reponseTime_ms : String(responseTime),
            });
        }
        else {
            // error 
             pipeline.xAdd("betterstack:db", "*", {
               region_id: "3d9ac87b-18e9-4eaa-8f91-1816a00099ec",
               website_id: message.message.id,
               status: "DOWN",
               reponseTime_ms: String(responseTime),
             });

        }
    }catch(e){
        console.log("failed to fetch the url wrong url ");
    }
  
         const results = await pipeline.exec();
         console.log(`Successfully synced ${results.length} entries.`);
      
        await client.xAck("betterstack:website", "india", message.id);
      }
    }

    // they are not getting pushed tot he db 


   // got all the 4 things





   }
   
 }
 main () ; 
