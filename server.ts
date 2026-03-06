import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Speaking Club State
  interface Member {
    id: string; // socket.id
    name: string;
    isPremium: boolean;
  }

  interface Room {
    id: string;
    name: string;
    topic: string;
    level: string;
    creator: string;
    members: Member[];
    limit: number;
    createdAt: number;
    expiresAt: number;
  }

  const rooms: Record<string, Room> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("get-rooms", () => {
      socket.emit("rooms-list", Object.values(rooms));
    });

    socket.on("create-room", ({ name, topic, level, creator, limit, isPremium }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = Date.now();
      const expiresAt = createdAt + 30 * 60 * 1000; // 30 minutes

      rooms[id] = { 
        id, 
        name, 
        topic, 
        level, 
        creator, 
        members: [{ id: socket.id, name: creator, isPremium: !!isPremium }], 
        limit, 
        createdAt, 
        expiresAt 
      };
      
      socket.join(id);
      socket.emit("room-created", id); // Send back the ID to the creator
      socket.emit("room-joined", rooms[id]); // Immediately join the creator to the room
      io.emit("rooms-list", Object.values(rooms));
    });

    socket.on("join-room", ({ roomId, user }) => {
      if (rooms[roomId] && rooms[roomId].members.length < rooms[roomId].limit) {
        const member = { id: socket.id, name: user.name, isPremium: !!user.isPremium };
        rooms[roomId].members.push(member);
        socket.join(roomId);
        io.to(roomId).emit("user-joined", member);
        socket.emit("room-joined", rooms[roomId]); // Confirm join to the user
        io.emit("rooms-list", Object.values(rooms));
      } else {
        socket.emit("error", "Room is full or does not exist");
      }
    });

    // WebRTC Signaling
    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
      io.to(payload.target).emit("ice-candidate", payload);
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const index = rooms[roomId].members.findIndex(m => m.id === socket.id);
        if (index !== -1) {
          rooms[roomId].members.splice(index, 1);
          io.to(roomId).emit("user-left", socket.id);
          
          if (rooms[roomId].members.length === 0) {
            delete rooms[roomId];
          }
          
          io.emit("rooms-list", Object.values(rooms));
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
