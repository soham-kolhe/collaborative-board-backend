import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
require("dotenv").config();

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your React app URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for drawing data
  socket.on("draw_text", (data) => {
    // Broadcast data to all other connected clients
    socket.broadcast.emit("draw_text", data);
  });

  socket.on("draw_shape", (data) => {
    socket.broadcast.emit("draw_shape", data);
  });

  // Listen for clear canvas
  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
