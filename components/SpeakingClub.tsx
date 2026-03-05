
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';

interface SpeakingClubProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
  onShowPaywall?: () => void;
}

interface Room {
  id: string;
  name: string;
  creator: string;
  members: string[];
  limit: number;
  createdAt: number;
}

const SpeakingClub: React.FC<SpeakingClubProps> = ({ user, onNavigate }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('rooms-list', (rooms: Room[]) => {
      setRooms(rooms);
    });

    newSocket.on('user-joined', (userId) => {
      console.log('User joined:', userId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (socket && roomName) {
      socket.emit('create-room', { name: roomName, creator: user.name, limit: 5 });
      setRoomName('');
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', roomId);
      setCurrentRoom(rooms.find(r => r.id === roomId) || null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1222] p-6 text-white">
      <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Speaking Club</h1>
      
      {!currentRoom ? (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-[35px] border border-white/10">
            <input 
              type="text" 
              value={roomName} 
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Guruh nomi..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 text-white"
            />
            <button onClick={createRoom} className="w-full liquid-button py-4 rounded-[25px] font-black uppercase">Guruh Yaratish</button>
          </div>

          <div className="space-y-4">
            {rooms.map(room => (
              <div key={room.id} className="glass-card p-6 rounded-[35px] border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{room.name}</h3>
                  <p className="text-xs text-slate-400">Yaratuvchi: {room.creator} | {room.members.length}/{room.limit}</p>
                </div>
                <button onClick={() => joinRoom(room.id)} className="bg-blue-600 px-6 py-2 rounded-full font-bold">Qo'shilish</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-[35px] border border-white/10 flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-black italic mb-4">{currentRoom.name}</h2>
          <p className="text-slate-400 mb-8">Guruhda {currentRoom.members.length} kishi bor.</p>
          <button onClick={() => setCurrentRoom(null)} className="bg-red-600 px-8 py-4 rounded-full font-bold">Chiqish</button>
        </div>
      )}
    </div>
  );
};

export default SpeakingClub;
