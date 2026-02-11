
import {prismaClient} from "@repo/db/client";
import express from "express";
import cors from "cors";
const app   = express();
import { userRouter  } from "./routes/v1/users";
import { websiteRouter } from "./routes/v1/websites";
app.use(cors());
app.use(express.json());



app.use("/users", userRouter);
app.use("/website", websiteRouter);

app.get("/test", (req ,res )=>{
    return res.json({msg : "i am up "});

})

app.listen(3000, ()=>{console.log("app is listening on the port 3000")});

