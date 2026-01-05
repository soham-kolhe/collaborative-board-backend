const users = {};
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ userName, roomId }) => {
    socket.join(roomId);
    users[socket.id] = { userName, roomId };

    // Get all users in the specific room
    const roomUsers = Object.values(users)
      .filter((u) => u.roomId === roomId)
      .map((u) => u.userName);

    // Tell everyone in the room (including the joiner) the new user list
    io.to(roomId).emit("user_list", roomUsers);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const { roomId } = user;
      delete users[socket.id];

      const remainingUsers = Object.values(users)
        .filter((u) => u.roomId === roomId)
        .map((u) => u.userName);

      io.to(roomId).emit("user_list", remainingUsers);
    }
  });

  // Ensure these broadcast events include the sender's data for OTHERS
  socket.on("draw", (data) => socket.to(data.roomId).emit("draw", data));
  socket.on("draw_shape", (data) =>
    socket.to(data.roomId).emit("draw_shape", data)
  );

  socket.on("draw_text", (data) => {
    socket.to(data.roomId).emit("draw_text", data);
  });

  socket.on("clear_canvas", (data) => {
    socket.to(data.roomId).emit("clear_canvas");
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
