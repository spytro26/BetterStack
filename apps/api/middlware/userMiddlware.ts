import jwt from "jsonwebtoken";
import "dotenv/config"
import { type Request, type Response, type NextFunction, request } from "express";


// Extend Express Request to include user/admin ID
export interface AuthRequest extends Request {
  userId?: string;
  adminId?: string;
  token? : string;
}

export function userMiddleware (req : AuthRequest , res : Response , next : NextFunction) {

    const token = req.headers.authorization;
    console.log(token  + "is the token ")
    if(!token){
        return res.status(400).json({mesage : "token not found "});
    }
    const validToken = jwt.verify(token , process.env.jwt_secret  || "ankush");
    if(!validToken){
        return res.status(400).json({message : "invlaid token "});

    }
    req.userId=validToken as string;
    console.log(req.userId + "userId is this ");
    next();
    




}


