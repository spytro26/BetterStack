import { prismaClient } from "@repo/db/client";
import express from "express";
import bcrypt from "bcrypt"
import "dotenv/config";
import z from "zod";
export const userRouter = express.Router();
import type  { AuthRequest } from "../../middlware/userMiddlware";
import { userMiddleware } from "../../middlware/userMiddlware";

import jwt from "jsonwebtoken"
import { Auth } from "../../types/auth";

userRouter.post("/signup",async  (req : AuthRequest, res)=>{
   
  const result = Auth.safeParse(req.body);

    if(!result.success){
        return res.status(411).json({message : "invalid body",
            hope : result.error.issues[0]?.message, 
           
        });
    }
     const { username, password, phone, email } = req.body;
     console.log("after the boddy ");
     console.log(req.body , "is the body in the signup ")
    const hash = await bcrypt.hash(password, 3);
    try {
        console.log("inside db creation of signup")
        await prismaClient.user.create({
        data : {
            username,
            password :hash, 
            mail : email?? " no email",
            number : phone?? "no phone "
            
        }
    })
    console.log("created succefully in the signup");

    }catch(e){
        console.log(e);
        if(e instanceof(Error)){
            console.log("ankush");
            console.log(e.message);
        }
        return res.status(411).json({message : "error while creating user "});
    }
    return res.json({message : "user created"});
    


})


userRouter.post("/signin",async  (req, res)=>{
   
   const result = Auth.safeParse(req.body);

    if(!result.success){
        return res.json({message : "wrong body"});
    }
     const { username, password } = req.body;
    const name = await prismaClient.user.findFirst({
        where : {username}
    });
    if(!name){
        return res.json({message  : "this type of returning is vulenrabel in prod"});

    }
    const user =await bcrypt.compare(password,name.password);
    if(user){
       const token =  jwt.sign(name.id, process.env.jwt_secret  || "ankush");
        return res.json({token  });
        

    }
    else {
        return res.status(411).json({});
    }

    
});

userRouter.use(userMiddleware);
userRouter.get("/status/:websiteId" , async (req : AuthRequest, res )=>{
    const userId = req.userId;
    const websiteUrl = (req.params.websiteId) as string;
    let details;
try {
       details = await prismaClient.website.findFirst({
        where : {
            user_id  : userId!,
            url : websiteUrl!


        },
        include:{
            ticks : {
                orderBy : [{
                    createdat : "desc"
                }],
                take : 1
            }

        }
    })

}catch(e){
    return res.json({message : "website not present"});
}

return res.json({details});

   



});
