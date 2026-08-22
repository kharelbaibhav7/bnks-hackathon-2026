import cors from "cors";
import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { port } from "./src/constant/constant.js";
import connectToMongoDb from "./src/connectDB/connectToMongoDB.js";
import errorMiddleware from "./src/middleware/errorMiddleware.js";
import router from "./src/router/index.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH", "DELETE"] },
});

app.set("io", io);
app.use(cors());
app.use(json({ limit: "8mb" }));
app.use("/api", router);
app.use(errorMiddleware);

io.on("connection", (socket) => {
  socket.on("join", (room) => {
    if (room) socket.join(String(room));
  });
});

const currentPort = port || 8000;
server.listen(currentPort, () => {
  console.log(`AgriFlow API listening on ${currentPort}`);
  connectToMongoDb();
});
