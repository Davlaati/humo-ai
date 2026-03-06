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
    userId: string; // Persistent User ID
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
    isFriendsOnly?: boolean;
    allowedUserIds?: string[];
  }

  const rooms: Record<string, Room> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("get-rooms", () => {
      socket.emit("rooms-list", Object.values(rooms));
    });

    socket.on("create-room", ({ name, topic, level, creator, limit, isPremium, userId, isFriendsOnly, allowedUserIds }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = Date.now();
      const expiresAt = createdAt + 30 * 60 * 1000; // 30 minutes

      rooms[id] = { 
        id, 
        name, 
        topic, 
        level, 
        creator, 
        members: [{ id: socket.id, userId, name: creator, isPremium: !!isPremium }], 
        limit, 
        createdAt, 
        expiresAt,
        isFriendsOnly: !!isFriendsOnly,
        allowedUserIds: allowedUserIds || []
      };
      
      socket.join(id);
      socket.emit("room-created", id); // Send back the ID to the creator
      socket.emit("room-joined", rooms[id]); // Immediately join the creator to the room
      io.emit("rooms-list", Object.values(rooms));
    });

    socket.on("join-room", ({ roomId, user }) => {
      const room = rooms[roomId];
      if (room) {
        if (room.members.length >= room.limit) {
          socket.emit("error", "Room is full");
          return;
        }

        if (room.isFriendsOnly) {
          // Check if user is allowed
          // The creator is already in members, so this check is for new joiners
          // We check if the joining user's ID is in the allowed list
          // OR if they are the creator (though creator joins on create)
          // Wait, creator joins on create.
          
          // If allowedUserIds is present, check it.
          // Note: allowedUserIds should contain IDs of friends.
          // Does it contain the creator's ID? Probably not necessary if we trust the creator logic.
          // But for safety, let's assume allowedUserIds contains the list of people who CAN join.
          
          const isAllowed = room.allowedUserIds?.includes(user.id);
          if (!isAllowed) {
             socket.emit("error", "This room is for friends only");
             return;
          }
        }

        const member = { id: socket.id, userId: user.id, name: user.name, isPremium: !!user.isPremium };
        room.members.push(member);
        socket.join(roomId);
        io.to(roomId).emit("user-joined", member);
        socket.emit("room-joined", room); // Confirm join to the user
        io.emit("rooms-list", Object.values(rooms));
      } else {
        socket.emit("error", "Room does not exist");
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
