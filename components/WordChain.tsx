import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';

interface WordChainProps {
  user: UserProfile;
  onBack: () => void;
}

const WordChain: React.FC<WordChainProps> = ({ user, onBack }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [word, setWord] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [message, setMessage] = useState('O\'yinni boshlash uchun so\'z kiriting!');

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('word-chain:update', (data: { lastWord: string; message: string }) => {
      setLastWord(data.lastWord);
      setMessage(data.message);
    });

    return () => { s.disconnect(); };
  }, []);

  const handleSubmit = () => {
    if (socket && word.trim()) {
      socket.emit('word-chain:submit', { word, userId: user.id });
      setWord('');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900 text-white">
      <h2 className="text-2xl font-bold mb-4">So'z Zanjiri</h2>
      <p className="mb-4">Oxirgi so'z: <span className="font-bold text-blue-400">{lastWord || 'Yo\'q'}</span></p>
      <p className="mb-4 text-sm text-gray-400">{message}</p>
      <input 
        value={word} 
        onChange={(e) => setWord(e.target.value)}
        className="p-3 rounded bg-slate-800 mb-4"
        placeholder="So'z kiriting..."
      />
      <button onClick={handleSubmit} className="p-3 bg-blue-600 rounded">Yuborish</button>
      <button onClick={onBack} className="mt-4 text-gray-400">Orqaga</button>
    </div>
  );
};

export default WordChain;
