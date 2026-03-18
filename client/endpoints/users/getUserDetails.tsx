import axios from "axios";
import { backendClient } from "../../backendClient";

export const GET_USER_PERSONAL_INFO = "get-all-user-personal-info"
export const getUserPersonalInfo = async () => {
  try {
    const response = await backendClient.get(`/users/me`);
    // const response = await axios.get(`https://staging.sportyexpats.fr/api/users/me`, {
    //   headers: {
    //     Authorization: "Bearer eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18yajBlYmdlcWI1dkE0RWlxTzY2c0tyUnZCejMiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3NzM4MDgwMDAsImZ2YSI6WzUsLTFdLCJpYXQiOjE3NzM4MDc5NDAsImlzcyI6Imh0dHBzOi8vZWxlY3RyaWMtY2F0LTI2LmNsZXJrLmFjY291bnRzLmRldiIsImp0aSI6ImIyYWQ2ODE0Mzg3NjM5OWVjMzljIiwibWV0YWRhdGEiOnt9LCJuYmYiOjE3NzM4MDc5MzAsInNpZCI6InNlc3NfM0I2UmJScU9vOFB0d0FRdTVwVjFDdXE0Q3NRIiwic3RzIjoiYWN0aXZlIiwic3ViIjoidXNlcl8zQjVCTHJwNFZ1WmtsY3Q2QXBEVjhPODY1c2oiLCJ2IjoyfQ.C9S26z1SwdqF2VVM0Yg42sSVMf5iS3tk8clhScRhtcqYUVqQjn76zgyx-yM53EwPUl6DzDmg7nKCiansVmhp3oUeU2mAq09m7g4Th1ZxHHCTkIMwQ2UxLhNoFKlFe7Kh9oxZxRATSzRyHDW1Zkk2_Mne9onBDcCxoP1Aq-DZ9OTVb5o7OcjgDc2hfqDwM9zyKoCf5Yfl2RUxG9vRkGjrSoyZ69UThV4SVNWC0wN8E8KKCUVIgTM2FICBthaji3jTiVEgOs8EAOVFE-CE8rU0KS4SEd3EG6c74-86kxU0IV6hW8_Uy1EApg864nLXAgwdWm3R2ugreXEoGH3GawqUeA"
    //   }
    // });

    console.log("GET /users/me response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log("GET /users/me error:", error);
    throw error;
  }
};
