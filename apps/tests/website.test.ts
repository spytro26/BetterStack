import { beforeAll, describe, expect, expectTypeOf, it } from "bun:test";
import axios from "axios";
let baseUrl = "http://localhost:3000";
import {signUPSignin} from "./test_utils";
import { Base_url } from "../api/config";
let jwt , url : string  ; 
beforeAll(async () =>{
 const created =  await signUPSignin();
 if (created){
   jwt = created.jwt;
   url = created.url; 
    console.log(jwt, "thisi s the outis ");
    console.log(url, "url");


 }

  // created user for this on e
},90000)
describe("website gets created", () => {
  it("website not created if url is not presnt ", async () => {
    try {
      await axios.post(`${baseUrl}/website/create`, {});
      expect(false, "website created when it shold not ");
    } catch (e) {
      expect(true, "not creating the website");
    }
  });



   it("website  created if url is  presnt ", async () => {
     try {
       await axios.post(`${baseUrl}/website/create`, {userId : "1" , url : "fb.com"});
       expect(true, "website created  ");
     } catch (e) {
       expect(false, "not creating the website");
     }
   });
});


describe("testing signup " ,()=>{
  it("no signin with missing req filed", async ()=>{
    try {
      await axios.post(`${baseUrl}/users/signup`,{});
      expect(false , "user created without the body ");
    }catch(e){
      expect (true , "user not created when no body ");
    }
  })

  it("user created when corect req body " , async () =>{
    await axios.post(`${baseUrl}/users/signup`, {
      username : Date.now().toString(),
      password : "ankushrajsec",
      mail : "optional@gmail.com"
    });
    expect (true , "user created when correct body");
    


  })



} )



describe("testing status " , ()=>{
  it("testing site with jwt"  , async ()=>{
    try {
      const site = await axios.get(`${Base_url}/users/status/${url}`,{
        headers : {
          authorization : jwt!
        }
      } );

      expect(true , "got the  status ");
    }catch(e){
        expect(false , "can,t get it with proper jwt ");

    }
  })

  it("testing site without jwt", async () => {
    try {
      const site = await axios.get(`${Base_url}/users/status/${url}`);

      expect(false, "site created even without the jwt ");
    } catch (e) {
      expect(true, "can,t get it with proper jwt ");
    }
  });


 
})

