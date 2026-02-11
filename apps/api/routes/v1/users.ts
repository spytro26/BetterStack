import { prismaClient } from "@repo/db/client";
import express from "express";
import bcrypt from "bcrypt"
import z from "zod";
export const userRouter = express.Router();
// import jsonwebtoken  from "jsonwebtoken";
import jwt from "jsonwebtoken"
import { Auth } from "../../types/auth";

userRouter.post("/signup",async  (req, res)=>{
   
  const result = Auth.safeParse(req.body);

    if(!result.success){
        return res.status(411).json({message : "invalid body",
            hope : result.error.issues[0]?.message, 
           
        });
    }
     const { username, password, phone, email } = req.body;

    const hash = await bcrypt.hash(password, 3);
    try {
        await prismaClient.user.create({
        data : {
            username,
            password :hash, 
            mail : email?? " no email",
            number : phone?? "no phone "
            
        }
    })

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
       const token =  jwt.sign(name.id, "ankush");
        return res.json({token  });
        

    }
    else {
        return res.status(411).json({});
    }

    
});


userRouter.get("/status/:websiteId" , (req, res )=>{


});
