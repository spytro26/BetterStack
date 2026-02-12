import { prismaClient } from "@repo/db/client";
import express from "express";
import {
  userMiddleware,
  type AuthRequest,
} from "../../middlware/userMiddlware";
export const websiteRouter = express.Router();
websiteRouter.use(userMiddleware);

websiteRouter.post("/create", async (req : AuthRequest, res) => {
  const {  url } = req.body;
  if (  !url) {
    return res.status(411).json({});
  }
  const userId = req.userId!;
  try {
    const reponse = await prismaClient.website.create({
      data: {
        url: url as string,
        user_id: userId,
      },
    });
    console.log("website created succesfll")
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
    return res.status(400).json({ message: "error while createing site" });
  }
  
  return res.status(200).json({ message: "website created successful" });
});
