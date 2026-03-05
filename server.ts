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
  const rooms: Record<string, { id: string; name: string; creator: string; members: string[]; limit: number; createdAt: number }> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("get-rooms", () => {
      socket.emit("rooms-list", Object.values(rooms));
    });

    socket.on("create-room", ({ name, creator, limit }) => {
      const id = Math.random().toString(36).substring(7);
      rooms[id] = { id, name, creator, members: [socket.id], limit, createdAt: Date.now() };
      socket.join(id);
      io.emit("rooms-list", Object.values(rooms));
    });

    socket.on("join-room", (roomId) => {
      if (rooms[roomId] && rooms[roomId].members.length < rooms[roomId].limit) {
        rooms[roomId].members.push(socket.id);
        socket.join(roomId);
        io.to(roomId).emit("user-joined", socket.id);
        io.emit("rooms-list", Object.values(rooms));
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const index = rooms[roomId].members.indexOf(socket.id);
        if (index !== -1) {
          rooms[roomId].members.splice(index, 1);
          if (rooms[roomId].members.length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit("user-left", socket.id);
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
