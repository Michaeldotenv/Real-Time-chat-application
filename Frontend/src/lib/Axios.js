import axios from "axios";

export const AxiosInstance = axios.create({
    baseURL : import.meta.env.VITE_API_URL + "/api" || "http://localhost:5001/api/auth" ,
    withCredentials : true
})