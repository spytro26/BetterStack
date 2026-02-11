import { prismaClient } from "@repo/db/client";
import express from "express";
export const websiteRouter = express.Router();


websiteRouter.post("/create" , async (req, res )=>{
    const {userId  , url   }   = req.body;
    if(!userId || !url ){
        return res.status(411).json({});
    }
    try {
        const reponse = await prismaClient.website.create({
            data : {
                url : url as string  , 
                user_id : userId


            }
        })
    }catch(e){
        if(e instanceof(Error)){
            console.log(e.message);
        }
        return res.status(400).json({message : "error while createing site"});

    }
    return res.status(200).json({message : "signup successful"})
    

});
