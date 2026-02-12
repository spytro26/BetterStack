
import { Base_url } from "../api/config";
import axios from "axios";
export async function signUPSignin(): Promise<{
  jwt: string;
  url: string;
} | void> {
  const user_name = Date.now().toString().substring(0,10);
  const password = "something";
  let siginin;
  const url = Date.now().toString();
  try {
   

   
      const user = await axios.post(`${Base_url}/users/signup`, {
        username: user_name,
        password : password,
      });
    

    console.log(1);
   siginin = await axios.post(`${Base_url}/users/signin`, {
      username: user_name,
      password,
    });

    console.log(2);


    console.log("signin token is " + siginin.data.token);
    const createSite = await axios.post(
      `${Base_url}/website/create`,
      {
        url,
      },
      {
        headers: {
          authorization: siginin.data.token,
        },
      },
    );
    console.log("website also created");
  } catch (e) {
    console.log("error while axios ");
    console.log(e);
    return;
  }

  return {
    jwt: siginin!.data.token,
    url,
  };
}
