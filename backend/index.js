import express, { json } from "express";
import { port } from "./src/constant/constant.js";
import cors from "cors";
import errorMiddleware from "./src/middleware/errorMiddleware.js";
import connectToMongoDb from "./src/connectDB/connectToMongoDB.js";

const app = express();
app.use(cors());

const current_port = port || 8000;
app.listen(port, () => {
  console.log(`express app is listening at port ${current_port}`);
  connectToMongoDb();
});
app.use(json());

// app.use("/api", router)
app.use(errorMiddleware);
