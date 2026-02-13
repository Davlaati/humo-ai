import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SpeakingStatus, PartnerType } from '../types';
import { generateConversationResponse, playTextToSpeech } from '../services/geminiService';
import { saveUser } from '../services/storageService';

interface SpeakingClubProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

const SpeakingClub: React.FC<SpeakingClubProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [status, setStatus] = useState<SpeakingStatus>('idle');
  const [partnerType, setPartnerType] = useState<PartnerType>('ai');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [micPermission, setMicPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio simulation refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Conversation Mock
  const [transcript, setTranscript] = useState<{sender: 'me' | 'partner', text: string}[]>([]);

  useEffect(() => {
    return () => {
      stopMedia();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setMicPermission(true);
      setError(null);
      startMatching();
    } catch (e) {
      console.error(e);
      setError("Camera/Microphone access denied. Using Avatar mode.");
      setMicPermission(false);
      // Proceed without media if blocked, simulated via avatar
      startMatching();
    }
  };

  const startMatching = () => {
    setStatus('searching');
    setElapsedTime(0);
    
    // AI Fallback Logic:
    // Try to "match" for 5-8 seconds. If no real user (simulated), connect to AI.
    const searchTime = 5000 + Math.random() * 3000;
    
    searchTimeoutRef.current = setTimeout(() => {
        setPartnerType('ai');
        setStatus('connected');
        playTextToSpeech("Hello! I am Humobek AI. Let's practice English together!");
        setTranscript([{ sender: 'partner', text: "Hello! I am Humobek AI. Let's practice English!" }]);
    }, searchTime);
  };

  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const endSession = () => {
    setStatus('ended');
    stopMedia();
    
    // XP Calculation: 10 XP per minute
    const xpEarned = Math.max(10, Math.floor(elapsedTime / 60) * 10);
    const updatedUser = { 
        ...user, 
        xp: user.xp + xpEarned,
        coins: user.coins + 5 // Small coin reward
    };
    onUpdateUser(updatedUser);
  };

  const handleSimulatedSpeaking = async () => {
      // Simulate user speaking (since we don't have STT in this demo without key)
      const userPhrases = [
          "My name is " + user.name + " and I want to improve my speaking.",
          "I am interested in " + user.interests[0] + ".",
          "How are you today?",
          "Can you help me with grammar?"
      ];
      const randomPhrase = userPhrases[Math.floor(Math.random() * userPhrases.length)];
      
      setTranscript(prev => [...prev, { sender: 'me', text: randomPhrase }]);
      
      // AI Response
      if (partnerType === 'ai') {
          setTimeout(async () => {
              const reply = await generateConversationResponse(randomPhrase, user.level);
              if (reply) {
                  setTranscript(prev => [...prev, { sender: 'partner', text: reply }]);
                  playTextToSpeech(reply);
              }
          }, 1500);
      }
  };

  // --- RENDER PHASES ---

  if (status === 'idle') {
      return (
          <div className="flex flex-col h-full p-6 animate-fade-in relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

             <div className="flex items-center mb-6">
                <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center mr-4">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h1 className="text-2xl font-bold">Speaking Club</h1>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <div className="relative w-40 h-40 mb-8">
                     <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                     <div className="relative w-full h-full glass-card rounded-full flex items-center justify-center border-4 border-blue-500/30">
                         <i className="fa-solid fa-headset text-6xl text-blue-400"></i>
                     </div>
                     <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center font-bold text-xs">
                         AI
                     </div>
                 </div>

                 <h2 className="text-3xl font-bold mb-3">Global Speaking</h2>
                 <p className="text-gray-400 mb-8 max-w-xs">
                     Connect with random students or our AI tutor to practice speaking in real-time.
                 </p>

                 <div className="grid grid-cols-2 gap-4 w-full mb-8">
                     <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                         <i className="fa-solid fa-bolt text-yellow-400 text-2xl mb-2"></i>
                         <span className="text-xs text-gray-400">Match Speed</span>
                         <span className="font-bold text-sm">~10 sec</span>
                     </div>
                     <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                         <i className="fa-solid fa-shield-halved text-green-400 text-2xl mb-2"></i>
                         <span className="text-xs text-gray-400">Safety</span>
                         <span className="font-bold text-sm">Monitored</span>
                     </div>
                 </div>

                 <button 
                    onClick={startCamera}
                    className="w-full liquid-button py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-95 transition"
                 >
                     Start Matching
                 </button>
                 {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
             </div>
          </div>
      );
  }

  if (status === 'searching') {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden bg-slate-900">
              {/* Radar Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-[500px] h-[500px] border border-blue-500/20 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
                   <div className="w-[300px] h-[300px] border border-blue-500/40 rounded-full animate-ping absolute" style={{animationDuration: '2s'}}></div>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 relative mb-6">
                      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                      {!micPermission && <div className="absolute inset-0 bg-slate-800 flex items-center justify-center"><i className="fa-solid fa-user text-4xl text-gray-500"></i></div>}
                  </div>
                  <h2 className="text-2xl font-bold animate-pulse mb-2">Finding Partner...</h2>
                  <p className="text-gray-400 text-sm">Looking for level {user.level} students</p>
                  
                  <button onClick={() => {
                      setStatus('idle');
                      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  }} className="mt-12 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold">
                      Cancel
                  </button>
              </div>
          </div>
      );
  }

  if (status === 'connected') {
      return (
          <div className="flex flex-col h-full bg-slate-950 relative">
              {/* Remote Video (Simulated AI) */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-900/20">
                  <div className="flex flex-col items-center animate-bounce-slow">
                      <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 p-1 mb-4 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                              <i className="fa-solid fa-robot text-6xl text-white"></i>
                              {/* Audio Viz */}
                              <div className="absolute bottom-0 w-full h-1/3 flex items-end justify-center space-x-1 pb-4">
                                  {[1,2,3,4,5].map(i => (
                                      <div key={i} className="w-1 bg-blue-400 rounded-full animate-music-bar" style={{height: Math.random() * 20 + 10 + 'px', animationDelay: i * 0.1 + 's'}}></div>
                                  ))}
                              </div>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold">Humobek AI</h3>
                      <p className="text-blue-300 text-sm">{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</p>
                  </div>
              </div>

              {/* Chat Overlay */}
              <div className="absolute top-20 left-4 right-4 h-64 overflow-y-auto pointer-events-none fade-mask-y">
                  <div className="flex flex-col space-y-3 justify-end h-full pb-4">
                      {transcript.map((t, i) => (
                          <div key={i} className={`flex ${t.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm backdrop-blur-md ${t.sender === 'me' ? 'bg-blue-600/60 text-white rounded-tr-none' : 'bg-slate-700/60 text-gray-200 rounded-tl-none'}`}>
                                  {t.text}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Controls */}
              <div className="h-1/3 bg-slate-900 rounded-t-3xl p-6 flex flex-col">
                   <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center space-x-3">
                           <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                               <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                           </div>
                           <div>
                               <p className="font-bold text-sm">{user.name}</p>
                               <p className="text-xs text-gray-400">Level: {user.level}</p>
                           </div>
                       </div>
                       <button onClick={handleSimulatedSpeaking} className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-xs font-bold animate-pulse">
                           <i className="fa-solid fa-microphone mr-2"></i> Speak (Sim)
                       </button>
                   </div>

                   <div className="flex items-center justify-around mt-auto">
                       <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                           <i className="fa-solid fa-microphone-slash"></i>
                       </button>
                       <button onClick={endSession} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 active:scale-95 transition">
                           <i className="fa-solid fa-phone-slash text-2xl"></i>
                       </button>
                       <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                           <i className="fa-solid fa-flag"></i>
                       </button>
                   </div>
              </div>
          </div>
      );
  }

  if (status === 'ended') {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 animate-slide-up">
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl text-white shadow-lg mb-6">
                  <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-3xl font-bold mb-2">Session Ended</h2>
              <p className="text-gray-400 mb-8">Good job practicing today!</p>
              
              <div className="w-full max-w-xs glass-card rounded-2xl p-6 mb-8">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                      <span className="text-gray-400">Duration</span>
                      <span className="font-bold text-xl">{Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400">XP Earned</span>
                      <span className="font-bold text-xl text-yellow-400">+{Math.max(10, Math.floor(elapsedTime / 60) * 10)} XP</span>
                  </div>
              </div>

              <button onClick={() => onNavigate('home')} className="w-full max-w-xs liquid-button py-4 rounded-xl font-bold text-lg">
                  Back to Home
              </button>
          </div>
      );
  }

  return null;
};

export default SpeakingClub;