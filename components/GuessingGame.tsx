import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';

interface GuessingGameProps {
  user: UserProfile;
  onBack: () => void;
}

const GuessingGame: React.FC<GuessingGameProps> = ({ user, onBack }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [guess, setGuess] = useState('');
  const [clue, setClue] = useState('Kutilyapti...');
  const [message, setMessage] = useState('O\'yinni boshlash uchun kutib turing!');

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('guessing-game:update', (data: { clue: string; message: string }) => {
      setClue(data.clue);
      setMessage(data.message);
    });

    return () => { s.disconnect(); };
  }, []);

  const handleGuess = () => {
    if (socket && guess.trim()) {
      socket.emit('guessing-game:submit', { guess, userId: user.id });
      setGuess('');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Topishmoq O'yini</h2>
      <p className="mb-4">Maslahat: <span className="font-bold text-green-400">{clue}</span></p>
      <p className="mb-4 text-sm text-gray-400">{message}</p>
      <input 
        value={guess} 
        onChange={(e) => setGuess(e.target.value)}
        className="p-3 rounded bg-slate-800 mb-4"
        placeholder="So'zni toping..."
      />
      <button onClick={handleGuess} className="p-3 bg-green-600 rounded">Taxmin qilish</button>
      <button onClick={onBack} className="mt-4 text-gray-400">Orqaga</button>
    </div>
  );
};

export default GuessingGame;
