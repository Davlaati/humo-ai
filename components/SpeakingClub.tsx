
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';
import { Users, Mic, MicOff, PhoneOff, Clock, Plus, MessageSquare, Globe, Headphones } from 'lucide-react';

interface SpeakingClubProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

interface Room {
  id: string;
  name: string;
  topic: string;
  level: string;
  creator: string;
  members: string[];
  limit: number;
  createdAt: number;
  expiresAt: number;
}

const TOPICS = [
  "General Conversation",
  "IELTS Speaking Part 1",
  "IELTS Speaking Part 2",
  "Travel & Culture",
  "Business English",
  "Technology & AI",
  "Movies & Books"
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Native"];

const SpeakingClub: React.FC<SpeakingClubProps> = ({ user, onNavigate }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', topic: TOPICS[0], level: LEVELS[1], limit: 4 });
  const [timeLeft, setTimeLeft] = useState<string>("30:00");
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('rooms-list', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    newSocket.on('room-created', (roomId) => {
      // Auto-join logic handled by server sending room-joined or we can optimistically set it
      // But server emits room-joined to the joiner. Creator is already joined on server.
      // Let's wait for room-joined or find it in the list.
      // Actually, for creator, we can just find the room in the updated list or wait for a specific event.
      // Simplified: The server adds creator to members. We just need to find the room.
    });

    newSocket.on('room-joined', (room: Room) => {
      setCurrentRoom(room);
      setIsCreating(false);
    });

    newSocket.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      // In a real app, we'd fetch user details here
    });

    newSocket.on('user-left', (userId) => {
      console.log('User left:', userId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (!currentRoom) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = currentRoom.expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        // Optionally auto-leave
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom]);

  const handleCreateRoom = () => {
    if (socket && newRoom.name) {
      socket.emit('create-room', { 
        name: newRoom.name, 
        topic: newRoom.topic, 
        level: newRoom.level, 
        creator: user.name, 
        limit: newRoom.limit 
      });
      // Optimistic UI update or wait for server response
      // For now, we rely on the server sending 'room-joined' or finding it in 'rooms-list'
      // But 'create-room' on server sends 'room-created' with ID.
      // Let's listen for 'room-created' and then find the room.
      socket.once('room-created', (id) => {
         // We need to fetch the room details or wait for rooms-list update
         // A simple hack: wait for the next rooms-list update and filter by ID
         // OR, server could send the full room object on creation.
         // Let's rely on the rooms-list update which broadcasts to everyone including creator.
      });
    }
  };
  
  // Watch for rooms update to auto-enter if we just created one
  useEffect(() => {
      if (socket && !currentRoom) {
          // If we are in the members list of any room, join it (reconnection logic or creation logic)
          const myRoom = rooms.find(r => r.members.includes(socket.id || ''));
          if (myRoom) {
              setCurrentRoom(myRoom);
              setIsCreating(false);
          }
      }
  }, [rooms, socket, currentRoom]);

  const handleJoinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.disconnect();
      const newSocket = io(); // Reconnect to get a fresh socket/id and leave the room on server
      setSocket(newSocket);
      // Re-bind listeners... (simplified for this demo, ideally we just emit 'leave-room')
      // Since server handles disconnect = leave, we can just refresh the socket.
      // Better: emit 'leave-room' event if we added it to server.
      // For now, disconnect/reconnect works to reset state.
      setCurrentRoom(null);
      
      // Re-bind listeners for the new socket
        newSocket.on('rooms-list', (updatedRooms: Room[]) => {
            setRooms(updatedRooms);
        });
        newSocket.on('room-joined', (room: Room) => {
            setCurrentRoom(room);
            setIsCreating(false);
        });
    }
  };

  if (currentRoom) {
    return (
      <div className="flex flex-col h-full bg-[#0c1222] relative overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-[#0c1222] pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div>
                    <h2 className="font-black text-white text-lg leading-none">{currentRoom.name}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{currentRoom.topic}</p>
                </div>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-mono font-bold text-blue-400">{timeLeft}</span>
            </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 relative z-10 p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            {currentRoom.members.map((memberId, index) => (
                <div key={memberId} className="aspect-square rounded-[30px] bg-slate-800/50 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-1 mb-3 relative">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            <span className="text-2xl font-black text-white">
                                {index === 0 ? currentRoom.creator.charAt(0) : `U${index}`}
                            </span>
                        </div>
                        {/* Speaking Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                            <Mic className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    
                    <p className="font-bold text-white text-sm">{index === 0 ? currentRoom.creator : `User ${index + 1}`}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {index === 0 ? 'Host' : 'Member'}
                    </p>

                    {/* Fake Audio Visualizer */}
                    <div className="flex items-center space-x-1 h-4 mt-3">
                        {[1, 2, 3, 2, 1].map((h, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-blue-400 rounded-full animate-pulse" 
                                style={{ 
                                    height: `${h * 4}px`, 
                                    animationDelay: `${Math.random()}s`,
                                    opacity: Math.random() > 0.5 ? 1 : 0.3
                                }} 
                            ></div>
                        ))}
                    </div>
                </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: currentRoom.limit - currentRoom.members.length }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-[30px] bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Users className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Empty Slot</p>
                </div>
            ))}
        </div>

        {/* Controls */}
        <div className="relative z-10 p-6 pb-10 flex justify-center items-center space-x-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10 text-white backdrop-blur-md border border-white/20'}`}
            >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <button 
                onClick={handleLeaveRoom}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 active:scale-95 transition-all"
            >
                <PhoneOff className="w-8 h-8 text-white" />
            </button>

            <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                <MessageSquare className="w-6 h-6" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0c1222] p-6 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
                <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Speaking Club</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 animate-pulse">
            <Globe className="w-5 h-5 text-green-400" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-40 rounded-[35px] bg-gradient-to-r from-blue-600 to-purple-600 p-6 mb-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Global Community</h2>
              <p className="text-xs font-medium text-white/80 max-w-[200px] leading-relaxed">
                  Join live voice rooms, practice with real people, and improve your speaking skills instantly.
              </p>
          </div>
          <Headphones className="absolute bottom-4 right-6 w-24 h-24 text-white/20 transform rotate-12" />
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-lg uppercase tracking-tight">Active Rooms <span className="text-slate-500 text-sm ml-2">({rooms.length})</span></h3>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-white text-slate-900 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
          >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
          </button>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20">
          {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No active rooms</p>
                  <p className="text-[10px] text-slate-600 mt-1">Be the first to start a conversation!</p>
              </div>
          ) : (
              rooms.map(room => (
                  <div key={room.id} className="glass-card p-5 rounded-[30px] border border-white/10 group active:scale-[0.98] transition-all">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="flex items-center space-x-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-wider border border-blue-500/20">
                                      {room.level}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-wider border border-purple-500/20">
                                      {room.topic}
                                  </span>
                              </div>
                              <h4 className="font-black text-lg leading-tight">{room.name}</h4>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-400">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-bold">{room.members.length}/{room.limit}</span>
                          </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                              {/* Fake avatars for visual interest */}
                              {[...Array(Math.min(3, room.members.length))].map((_, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0c1222] flex items-center justify-center text-[10px] font-bold">
                                      {String.fromCharCode(65 + i)}
                                  </div>
                              ))}
                              {room.members.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0c1222] flex items-center justify-center text-[10px] font-bold">
                                      +{room.members.length - 3}
                                  </div>
                              )}
                          </div>
                          <button 
                            onClick={() => handleJoinRoom(room.id)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                          >
                              Join Now
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Create Room Modal */}
      {isCreating && (
          <div className="fixed inset-0 z-50 bg-[#0c1222]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
              <div className="w-full max-w-md bg-[#151b2d] border border-white/10 rounded-[40px] p-8 shadow-2xl relative">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
                  >
                      <i className="fa-solid fa-xmark"></i>
                  </button>

                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Create Room</h3>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Room Name</label>
                          <input 
                            type="text" 
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                            placeholder="e.g. English Practice"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors font-bold"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Topic</label>
                          <div className="grid grid-cols-2 gap-2">
                              {TOPICS.slice(0, 4).map(t => (
                                  <button 
                                    key={t}
                                    onClick={() => setNewRoom({...newRoom, topic: t})}
                                    className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all ${newRoom.topic === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                                  >
                                      {t}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Level</label>
                          <div className="flex space-x-2">
                              {LEVELS.map(l => (
                                  <button 
                                    key={l}
                                    onClick={() => setNewRoom({...newRoom, level: l})}
                                    className={`flex-1 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all ${newRoom.level === l ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                                  >
                                      {l}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={handleCreateRoom}
                        disabled={!newRoom.name}
                        className="w-full liquid-button py-5 rounded-[25px] font-black text-lg uppercase tracking-widest shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Start Speaking
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SpeakingClub;
