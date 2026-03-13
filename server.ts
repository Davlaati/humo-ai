import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());
  
  const httpServer = createServer(app);
  
  // Supabase client for server
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
  );
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
    avatarUrl?: string;
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

    socket.on("create-room", ({ name, topic, level, creator, limit, isPremium, userId, isFriendsOnly, allowedUserIds, avatarUrl }, callback) => {
      try {
        const id = Math.random().toString(36).substring(2, 9);
        const createdAt = Date.now();
        const expiresAt = createdAt + 30 * 60 * 1000; // 30 minutes

        rooms[id] = { 
          id, 
          name, 
          topic, 
          level, 
          creator, 
          members: [{ id: socket.id, userId, name: creator, isPremium: !!isPremium, avatarUrl }], 
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

        if (typeof callback === 'function') {
          callback({ status: 'ok', roomId: id });
        }
      } catch (error) {
        console.error("Error creating room:", error);
        if (typeof callback === 'function') {
          callback({ status: 'error', message: 'Failed to create room' });
        }
      }
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

        const member = { id: socket.id, userId: user.id, name: user.name, isPremium: !!user.isPremium, avatarUrl: user.avatarUrl };
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

    // Word Chain Logic
    let currentWordChain = { word: 'ravona', combo: 0, lastUser: 'System' };
    const usedWords = new Set(['ravona']);

    socket.on('word-chain:join', () => {
      socket.emit('word-chain:update', { 
        lastWord: currentWordChain.word, 
        message: 'O\'yin boshlandi! 🔥', 
        combo: currentWordChain.combo,
        lastUser: currentWordChain.lastUser
      });
    });

    socket.on('word-chain:submit', ({ word, userId, userName }) => {
      const cleanWord = word.trim().toLowerCase();
      if (cleanWord.length < 2) return;

      const lastChar = currentWordChain.word.slice(-1).toLowerCase();
      
      if (cleanWord.startsWith(lastChar)) {
        if (usedWords.has(cleanWord)) {
          socket.emit('word-chain:error', 'Bu so\'z ishlatilgan! 🛑');
          return;
        }
        
        usedWords.add(cleanWord);
        currentWordChain = {
          word: cleanWord,
          combo: currentWordChain.combo + 1,
          lastUser: userName || userId
        };
        
        io.emit('word-chain:update', { 
          lastWord: currentWordChain.word, 
          message: `W Rizz! ${currentWordChain.lastUser} yordi! 🥶`, 
          combo: currentWordChain.combo,
          lastUser: currentWordChain.lastUser
        });
      } else {
        socket.emit('word-chain:error', `L bozo! So'z "${lastChar}" harfidan boshlanishi kerak 💀`);
      }
    });

    // Guessing Game Logic
    const riddles = [
      { q: "Ertalab to'rt oyoqda, tushda ikki oyoqda, kechqurun uch oyoqda. (Javob: Odam)", a: "odam" },
      { q: "O'zi bitta, ko'zi mingta. (Javob: Anor)", a: "anor" },
      { q: "Qo'lsiz, oyoqsiz eshik ochadi. (Javob: Shamol)", a: "shamol" },
      { q: "Oq sandig'im ochildi, ichidan ipak sochildi. (Javob: Paxta)", a: "paxta" },
      { q: "Kechasi chiqadi, kunduzi yo'qoladi. (Javob: Yulduz)", a: "yulduz" },
      { q: "Qanoti yo'q uchadi, Oyog'i yo'q qochadi. (Javob: Bulut)", a: "bulut" },
      { q: "O'zi qip-qizil, Sochlari yam-yashil. (Javob: Sabzi)", a: "sabzi" },
      { q: "Qat-qat to'nli, Qari chol. (Javob: Piyoz)", a: "piyoz" },
      { q: "Tishi bor, og'zi yo'q. (Javob: Arra)", a: "arra" },
      { q: "Kichkina bo'yi, Ko'p uning o'yi. (Javob: Kitob)", a: "kitob" }
    ];
    
    let currentRiddleIndex = Math.floor(Math.random() * riddles.length);

    socket.on('guessing-game:join', () => {
      socket.emit('guessing-game:update', { 
        clue: riddles[currentRiddleIndex].q.split('(Javob')[0].trim(), 
        message: 'Topishmoqni toping! 🤔' 
      });
    });

    socket.on('guessing-game:submit', ({ guess, userId, userName }) => {
      const cleanGuess = guess.trim().toLowerCase();
      const answer = riddles[currentRiddleIndex].a;

      if (cleanGuess === answer) {
        io.emit('guessing-game:success', {
          winner: userName || userId,
          answer: answer,
          message: `Sheesh! ${userName || userId} topdi! Javob: ${answer} 🎉`
        });
        
        // Next riddle
        currentRiddleIndex = (currentRiddleIndex + 1) % riddles.length;
        setTimeout(() => {
          io.emit('guessing-game:update', { 
            clue: riddles[currentRiddleIndex].q.split('(Javob')[0].trim(), 
            message: 'Yangi topishmoq! Kettik! 🚀' 
          });
        }, 3000);
      } else {
        socket.emit('guessing-game:error', `Xato! Yana urinib ko'ring 🤡`);
      }
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

  // Referral endpoint
  app.post('/api/referral', async (req, res) => {
    const { userId, referrerId } = req.body;
    if (!userId || !referrerId || userId === referrerId) {
      return res.status(400).json({ success: false });
    }

    try {
      // Check if user already has a referrer
      const { data: user } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', userId)
        .single();

      if (user && !user.referred_by) {
        // Update user's referred_by
        await supabase
          .from('profiles')
          .update({ referred_by: referrerId })
          .eq('id', userId);

        // Increment referrer's referral_count
        const { data: referrer } = await supabase
          .from('profiles')
          .select('referral_count')
          .eq('id', referrerId)
          .single();

        const newCount = (referrer?.referral_count || 0) + 1;
        await supabase
          .from('profiles')
          .update({ referral_count: newCount })
          .eq('id', referrerId);

        return res.json({ success: true });
      }
      res.json({ success: false, message: 'Already referred' });
    } catch (error) {
      console.error("Referral error:", error);
      res.status(500).json({ success: false });
    }
  });

  // Task verification endpoint
  app.post('/api/verify-tasks', async (req, res) => {
    const { userId, clientChannelJoined } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = '@ravonaai'; // Updated to match bot username

    try {
      // 1. Check channel subscription
      let isSubscribed = false;
      try {
        const response = await axios.get(`https://api.telegram.org/bot${botToken}/getChatMember`, {
          params: { chat_id: channelId, user_id: userId }
        });
        const status = response.data.result.status;
        isSubscribed = ['member', 'administrator', 'creator'].includes(status);
      } catch (e) {
        console.warn("Channel check failed:", e.message);
        // Fallback for dev if bot token is missing
        if (!botToken) isSubscribed = true; 
      }

      // 2. Check referral count
      const { data: user } = await supabase
        .from('profiles')
        .select('referral_count, wallet_reward_claimed')
        .eq('id', userId)
        .single();

      if (user?.wallet_reward_claimed) {
        return res.json({ success: false, message: 'Mukofot allaqachon olingan' });
      }

      const channelVerified = Boolean(clientChannelJoined) || isSubscribed;

      if (channelVerified && (user?.referral_count || 0) >= 3) {
        res.json({ success: true, referralCount: user?.referral_count });
      } else {
        let message = "";
        if (!channelVerified) message += "Kanalga obuna bo'ling. ";
        if ((user?.referral_count || 0) < 3) message += `Do'stlar yetarli emas (${user?.referral_count || 0}/3).`;
        res.json({ success: false, message });
      }
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.post('/api/telegram/receipt', async (req, res) => {
    const { userId, userName, receiptUrl, plan } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!botToken || !adminChatId) {
      return res.status(500).json({ success: false, message: 'Telegram bot config missing' });
    }

    try {
      const caption = [
        '🧾 Yangi premium to\'lov cheki',
        `👤 Foydalanuvchi: ${userName}`,
        `🆔 ID: ${userId}`,
        `📦 Tarif: ${plan}`
      ].join('\n');

      await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        chat_id: adminChatId,
        photo: receiptUrl,
        caption,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Tasdiqlash', callback_data: `approve_premium:${userId}` },
            { text: '❌ Rad etish', callback_data: `reject_premium:${userId}` }
          ]]
        }
      });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to send receipt to Telegram admin:', error?.response?.data || error);
      return res.status(500).json({ success: false, message: 'Failed to send receipt to Telegram' });
    }
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
