import { password } from "bun";
import {Base_url} from "../api/config"
import axios from "axios"
export async function signUPSignin ()  : Promise <{jwt : string , url : string} | void>{
    const user_name  = Date.now().toString();
    const password  = "somethingrandwom ";
    let siginin ; 
    const url = Date.now().toString();
  try {

  

    const user  =await  axios.post(`${Base_url}/users/signup`, {
        username  : user_name ,
        password 

    })


     siginin = await axios.post(`${Base_url}/users/signin`, {
       username : user_name ,
        password 
    });


    const createSite = await axios.post(`${Base_url}/website/create`, {
        url 
    }, {
        headers : {
            authorization : siginin.data.token 
        }
    })
}catch(e){
    console.log("error while axios ");
    return ;
}


    return {
        jwt : siginin!.data.token ,
        url ,
    }




}