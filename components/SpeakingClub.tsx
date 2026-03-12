
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';
import { Users, Mic, MicOff, PhoneOff, Clock, Plus, MessageSquare, Globe, Headphones, Star } from 'lucide-react';
import { awardXP } from '../services/gamificationService';
import { syncUserToSupabase } from '../services/supabaseService';

interface SpeakingClubProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onViewUser?: (userId: string) => void;
}

interface Member {
  id: string;
  userId: string;
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

const SpeakingClub: React.FC<SpeakingClubProps> = ({ user, onNavigate, onViewUser }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', topic: TOPICS[0], level: LEVELS[1], limit: 4, isFriendsOnly: false });
  const [timeLeft, setTimeLeft] = useState<string>("30:00");
  const [isMuted, setIsMuted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);

  // WebRTC Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteAudiosRef = useRef<Record<string, HTMLAudioElement>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const setupSocketListeners = (newSocket: Socket) => {
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('rooms-list', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    newSocket.on('room-created', (roomId) => {
      setIsSubmitting(false);
    });

    newSocket.on('room-joined', async (room: Room) => {
      console.log('Joined room:', room);
      setCurrentRoom(room);
      setJoinedAt(Date.now());
      setIsCreating(false);
      setIsSubmitting(false);
      await initWebRTC(newSocket, room.id);
    });

    // WebRTC Signaling
    newSocket.on('user-joined', async (member: Member) => {
      console.log('User joined, creating offer for:', member.id);
      const peer = createPeer(member.id, newSocket);
      peersRef.current[member.id] = peer;
      
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
      }

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      newSocket.emit('offer', { target: member.id, sdp: offer, sender: newSocket.id });
    });

    newSocket.on('offer', async ({ target, sdp, sender }) => {
        const peer = createPeer(sender || 'unknown', newSocket);
        peersRef.current[sender] = peer;
        
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        newSocket.emit('answer', { target: sender, sdp: answer, sender: newSocket.id });
    });

    newSocket.on('answer', async ({ sdp, sender }) => {
        const peer = peersRef.current[sender];
        if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    });

    newSocket.on('ice-candidate', async ({ candidate, sender }) => {
        const peer = peersRef.current[sender];
        if (peer) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    newSocket.on('user-left', (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      if (remoteAudiosRef.current[userId]) {
        remoteAudiosRef.current[userId].remove();
        delete remoteAudiosRef.current[userId];
      }
    });
    
    newSocket.on('error', (message) => {
        alert(message);
        setIsSubmitting(false);
    });
  };

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    setupSocketListeners(newSocket);

    return () => {
      newSocket.disconnect();
      cleanupWebRTC();
    };
  }, []);

  const initWebRTC = async (socket: Socket, roomId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      // We don't need to do anything else here, 'user-joined' will trigger offer creation
      // for existing users, they wait for 'user-joined'.
      // Wait, if I join, I am the new user. Existing users will send ME offers.
      // So I just need to be ready to receive offers.
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const createPeer = (targetId: string, socket: Socket) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: targetId, candidate: event.candidate, sender: socket.id });
      }
    };

    peer.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      remoteAudiosRef.current[targetId] = audio;
    };

    return peer;
  };

  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    Object.values(remoteAudiosRef.current).forEach(audio => audio.remove());
    remoteAudiosRef.current = {};
  };

  // Timer Logic
  useEffect(() => {
    if (!currentRoom) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = currentRoom.expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        handleLeaveRoom(true); // Auto leave and show rating
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom]);

  const handleCreateRoom = () => {
    if (socket && !isSubmitting) {
      if (!socket.connected) {
        alert("Connection lost. Please wait...");
        return;
      }

      setIsSubmitting(true);
      const roomName = newRoom.name.trim() || `English Practice #${Math.floor(Math.random() * 1000)}`;
      
      const allowedUserIds = newRoom.isFriendsOnly 
        ? [...(user.followers || []), ...(user.following || [])] 
        : [];

      socket.emit('create-room', { 
        name: roomName, 
        topic: newRoom.topic, 
        level: newRoom.level, 
        creator: user.name, 
        limit: newRoom.limit,
        isPremium: user.isPremium,
        userId: user.id,
        isFriendsOnly: newRoom.isFriendsOnly,
        allowedUserIds,
        avatarUrl: user.avatarUrl
      }, (response: any) => {
        if (response && response.status === 'error') {
          alert(response.message || "Failed to create room");
          setIsSubmitting(false);
        }
      });
    }
  };
  
  useEffect(() => {
      if (socket && !currentRoom) {
          const myRoom = rooms.find(r => r.members.some(m => m.id === socket.id));
          if (myRoom) {
              setCurrentRoom(myRoom);
              setIsCreating(false);
              setIsSubmitting(false);
          }
      }
  }, [rooms, socket, currentRoom]);

  const handleJoinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', { roomId, user: { id: user.id, name: user.name, isPremium: user.isPremium } });
    }
  };

  const handleLeaveRoom = (showRate = false) => {
    if (socket) {
      if (joinedAt) {
        const durationMinutes = Math.floor((Date.now() - joinedAt) / 60000);
        if (durationMinutes > 0) {
          const xpEarned = durationMinutes * 10; // 10 XP per minute
          const updatedUser = awardXP(user, xpEarned);
          syncUserToSupabase(updatedUser);
          alert(`Siz ${durationMinutes} daqiqa suhbatlashdingiz va ${xpEarned} XP oldingiz!`);
        }
      }

      socket.disconnect();
      cleanupWebRTC();
      
      const newSocket = io();
      setSocket(newSocket);
      setupSocketListeners(newSocket);
      
      setCurrentRoom(null);
      setJoinedAt(null);
      
      if (showRate) setShowRating(true);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  if (showRating) {
      return (
          <div className="flex flex-col h-full bg-[#0c1222] p-6 items-center justify-center">
              <div className="glass-card p-8 rounded-[40px] border border-white/10 text-center max-w-sm w-full">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
                      <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-white">Suhbat qanday o'tdi?</h2>
                  <p className="text-slate-400 text-xs font-bold mb-8">Hamkorlaringizni baholang</p>
                  
                  <div className="flex justify-center space-x-2 mb-8">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setRating(star)} className="focus:outline-none transform active:scale-90 transition">
                              <Star className={`w-8 h-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={() => setShowRating(false)}
                    className="w-full liquid-button py-4 rounded-[25px] font-black uppercase tracking-widest"
                  >
                      Yuborish
                  </button>
              </div>
          </div>
      );
  }

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
            {currentRoom.members.map((member, index) => (
                <div key={member.id} className={`aspect-square rounded-[30px] bg-slate-800/50 border relative overflow-hidden flex flex-col items-center justify-center group ${member.isPremium ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-white/10'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Avatar */}
                    <div className={`w-20 h-20 rounded-full p-1 mb-3 relative ${member.isPremium ? 'bg-gradient-to-br from-yellow-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-purple-600'}`}>
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-black text-white">
                                  {member.name.charAt(0)}
                              </span>
                            )}
                        </div>
                        {/* Speaking Indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${isMuted && member.id === socket?.id ? 'bg-red-500' : 'bg-green-500'}`}>
                            {isMuted && member.id === socket?.id ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                    
                    <p className={`font-bold text-sm flex items-center gap-1 ${member.isPremium ? 'text-yellow-400' : 'text-white'}`}>
                      {member.name}
                      {member.isPremium && <i className="fa-solid fa-crown text-[10px]"></i>}
                    </p>
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
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10 text-white backdrop-blur-md border border-white/20'}`}
            >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <button 
                onClick={() => handleLeaveRoom(true)}
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
                  <div key={room.id} className="glass-card p-5 rounded-[30px] border border-white/10 group active:scale-[0.98] transition-all relative overflow-hidden">
                      {room.isFriendsOnly && (
                          <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 z-10">
                              <i className="fa-solid fa-lock text-[10px]"></i>
                              Friends Only
                          </div>
                      )}
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
                              {/* Actual avatars */}
                              {room.members.slice(0, 3).map((member, i) => (
                                  <div 
                                    key={member.id} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewUser?.(member.userId);
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 border-[#0c1222] flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-110 transition-transform overflow-hidden ${member.isPremium ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-slate-800 text-white'}`}
                                  >
                                      {member.avatarUrl ? (
                                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                      ) : (
                                        member.name.charAt(0)
                                      )}
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
          <div className="fixed inset-0 z-[200] bg-[#0c1222]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
              <div className="w-full max-w-md bg-[#151b2d] border border-white/10 rounded-[40px] p-8 pb-10 shadow-2xl relative mb-20 sm:mb-0">
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

                      {/* Friends Only Toggle */}
                      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                          <div>
                              <h4 className="text-sm font-bold text-white">Friends Only</h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">Only followers & following can join</p>
                          </div>
                          <button 
                              onClick={() => setNewRoom({...newRoom, isFriendsOnly: !newRoom.isFriendsOnly})}
                              className={`w-12 h-6 rounded-full relative transition-colors ${newRoom.isFriendsOnly ? 'bg-green-500' : 'bg-slate-700'}`}
                          >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${newRoom.isFriendsOnly ? 'left-7' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <button 
                        onClick={handleCreateRoom}
                        disabled={isSubmitting || !socket}
                        className="w-full liquid-button py-5 rounded-[25px] font-black text-lg uppercase tracking-widest shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                          {isSubmitting ? (
                              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                              'Start Speaking'
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SpeakingClub;
