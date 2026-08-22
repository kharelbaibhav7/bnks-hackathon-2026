import { config } from "dotenv";
config();

export const email = process.env.EMAIL;
export const password = process.env.PASSWORD;
export const secretKey = process.env.SECRET_KEY;
export const port = process.env.PORT;
export const dbUrl = process.env.DB_URL;
