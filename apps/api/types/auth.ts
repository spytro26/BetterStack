import z from "zod";

export const Auth = z.object({
    username : z.string({ error: "it should be string only" }).min(3, "too short username").max(15, " too big usrename "),
    password : z.string().min(8, "too weak password").max(15, "no more than 15 "),
    mail : z.string("email shold be string only ").email("invalid email address").optional(),
    number : z.string("number should be string only ").max(13, "max length is 13").optional()

})

