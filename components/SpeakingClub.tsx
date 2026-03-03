
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, SpeakingStatus, PartnerType } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { saveUser } from '../services/storageService';

interface SpeakingClubProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

interface AnalysisReport {
  grammarErrors: { original: string; corrected: string; explanation: string }[];
  vocabularySuggestions: string[];
  pronunciationFeedback: string[];
  fluencyFeedback: string;
  scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    pronunciation: number;
  };
  overallLevel: string;
}

const AI_PERSONALITIES = [
  {
    id: 'ravona',
    name: 'Ravona AI',
    role: 'Supportive Tutor',
    voice: 'Zephyr',
    description: 'Friendly and encouraging, perfect for beginners.',
    prompt: (user: UserProfile) => `You are Ravona AI, a supportive English tutor. Correct the user politely if they make big mistakes. Current User: ${user.name}, Level: ${user.level}. Respond like a native speaker with a warm and encouraging tone.`
  },
  {
    id: 'sarah',
    name: 'Sarah (London)',
    role: 'Grammar Expert',
    voice: 'Kore',
    description: 'Focuses on precision and British English elegance.',
    prompt: (user: UserProfile) => `You are Sarah, a strict but fair English grammar expert from London. Focus on correcting the user's grammar and pronunciation. Use British English. Current User: ${user.name}, Level: ${user.level}.`
  },
  {
    id: 'alex',
    name: 'Alex (NYC)',
    role: 'Casual Friend',
    voice: 'Puck',
    description: 'Cool, uses slang and idioms. Great for natural flow.',
    prompt: (user: UserProfile) => `You are Alex, a casual friend from New York City. Use American slang and idioms naturally. Don't be too formal. Just have a cool conversation. Current User: ${user.name}, Level: ${user.level}.`
  },
  {
    id: 'dr_aris',
    name: 'Dr. Aris',
    role: 'Academic Professor',
    voice: 'Charon',
    description: 'Advanced vocabulary and formal structures for IELTS/TOEFL.',
    prompt: (user: UserProfile) => `You are Dr. Aris, an academic professor. Use sophisticated vocabulary and formal structures. Challenge the user to use more advanced English. Current User: ${user.name}, Level: ${user.level}.`
  }
];

// Audio Helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const SpeakingClub: React.FC<SpeakingClubProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [status, setStatus] = useState<SpeakingStatus>('idle');
  const [partnerInfo, setPartnerInfo] = useState<{name: string, type: PartnerType, level: string}>({ name: 'Ravona AI', type: 'ai', level: 'Native' });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<{sender: 'me' | 'partner', text: string}[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPersonality, setSelectedPersonality] = useState(AI_PERSONALITIES[0]);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);

  // Audio Contexts & Refs
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    return () => {
        stopAll();
    };
  }, []);

  const stopAll = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  const startSession = async (personalityOverride?: typeof AI_PERSONALITIES[0]) => {
    setError(null);
    setStatus('searching');
    setShowPersonalityPicker(false);
    
    // Simulyatsiya qilingan matching (70% AI, 30% Real User)
    const isRealUser = personalityOverride ? false : Math.random() > 0.7;
    const searchDelay = 2000 + Math.random() * 3000;

    setTimeout(async () => {
        const names = ["James (London)", "Akmal (Tashkent)", "Sarah (New York)", "Elena (Moscow)"];
        const selectedPartnerName = names[Math.floor(Math.random() * names.length)];
        
        let systemPrompt = "";
        let voice = "Zephyr";

        if (isRealUser) {
            setPartnerInfo({ name: selectedPartnerName, type: 'user', level: 'Intermediate+' });
            systemPrompt = `Siz hozir ingliz tilini o'rganayotgan talaba ${selectedPartnerName} rolidasiz. Foydalanuvchi bilan do'stona va ingliz tilida gaplashing. Faqat ingliz tilidan foydalaning.`;
        } else {
            const personality = personalityOverride || AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
            setSelectedPersonality(personality);
            setPartnerInfo({ name: personality.name, type: 'ai', level: 'Native' });
            systemPrompt = personality.prompt(user);
            voice = personality.voice;
        }
        
        await connectToLiveAPI(systemPrompt, voice);
    }, searchDelay);
  };

  const connectToLiveAPI = async (systemInstruction: string, voice: string = 'Zephyr') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const apiKey = process['env']['API_KEY'];
      const ai = new GoogleGenAI({ apiKey });
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice as any } } },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            const outCtx = inputAudioCtxRef.current!;
            const source = outCtx.createMediaStreamSource(stream);
            const scriptProcessor = outCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = { 
                data: encode(new Uint8Array(int16.buffer)), 
                mimeType: 'audio/pcm;rate=16000' 
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(outCtx.destination);
            setStatus('connected');
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = outputAudioCtxRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Transcriptions
            if (msg.serverContent?.inputTranscription) {
                setTranscript(prev => [...prev, { sender: 'me', text: msg.serverContent!.inputTranscription!.text }]);
            }
            if (msg.serverContent?.outputTranscription) {
                setTranscript(prev => [...prev, { sender: 'partner', text: msg.serverContent!.outputTranscription!.text }]);
            }

            if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            setError("Muloqotda xatolik yuz berdi. Qayta urinib ko'ring.");
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Microphone Access Denied:", err);
      setStatus('idle');
      setError("Mikrofonga ruxsat berilmagan yoki mikrofon topilmadi.");
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const endSession = async () => {
    setStatus('ended');
    stopAll();
    
    // Xatolarni analiz qilish
    setIsAnalyzing(true);
    try {
        const apiKey = process['env']['API_KEY'];
        const ai = new GoogleGenAI({ apiKey });
        const conversationText = transcript.map(t => `${t.sender}: ${t.text}`).join('\n');
        
        if (transcript.length < 2) {
            setAnalysis({
                grammarErrors: [],
                vocabularySuggestions: ["Suhbat juda qisqa bo'ldi."],
                overallLevel: "N/A"
            });
            setIsAnalyzing(false);
            return;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this English conversation transcript for errors and performance by the "me" speaker. Provide detailed feedback on grammar, vocabulary, pronunciation (based on phonetic hints in transcript), and fluency. Return JSON. 
            Transcript:
            ${conversationText}
            
            JSON schema: { 
                "grammarErrors": [{"original": "...", "corrected": "...", "explanation": "..."}], 
                "vocabularySuggestions": ["word1", "word2"], 
                "pronunciationFeedback": ["word1 - sounds like '...', should be '...'"],
                "fluencyFeedback": "Brief summary of pacing and hesitation",
                "scores": {
                    "grammar": 1-10,
                    "vocabulary": 1-10,
                    "fluency": 1-10,
                    "pronunciation": 1-10
                },
                "overallLevel": "A1-C2" 
            }`,
            config: { responseMimeType: 'application/json' }
        });
        
        const result = JSON.parse(response.text || '{}');
        setAnalysis(result);
    } catch (e) {
        console.error("Analysis failed:", e);
        setError("Tahlil jarayonida xatolik yuz berdi.");
    } finally {
        setIsAnalyzing(false);
    }

    const xpEarned = Math.max(15, Math.floor(elapsedTime / 60) * 15);
    onUpdateUser({ ...user, xp: user.xp + xpEarned, coins: user.coins + 10 });
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col h-full bg-[#0c1222] p-6 animate-fade-in overflow-y-auto no-scrollbar">
        <div className="flex items-center mb-10">
          <button onClick={() => onNavigate('home')} className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Speaking Club</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center pb-10">
          <div className="relative w-44 h-44 mb-10">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full glass-card rounded-full flex items-center justify-center border-4 border-blue-500/30 shadow-2xl">
              <i className="fa-solid fa-microphone-lines text-7xl text-blue-400"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-3 italic uppercase tracking-tighter">Jonli Muloqot</h2>
          <p className="text-slate-400 mb-10 max-w-xs text-sm font-medium leading-relaxed">
            Haqiqiy foydalanuvchilar yoki sun'iy intellekt bilan ovozli suhbat quring va xatolaringizni bilib oling.
          </p>
          
          <div className="w-full space-y-4">
            <button onClick={() => startSession()} className="w-full liquid-button py-5 rounded-[25px] font-black text-lg shadow-xl uppercase tracking-widest active:scale-95 transition">
              Tasodifiy Suhbatdosh
            </button>
            <button onClick={() => setShowPersonalityPicker(true)} className="w-full glass-card py-5 rounded-[25px] font-black text-lg uppercase tracking-widest active:scale-95 transition border border-white/10">
              AI Tutor Tanlash
            </button>
          </div>
          
          {error && <p className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">{error}</p>}
        </div>

        {/* Personality Picker Modal */}
        {showPersonalityPicker && (
            <div className="fixed inset-0 z-[5000] bg-[#0c1222]/90 backdrop-blur-xl p-6 flex flex-col animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">AI Tutor Tanlash</h3>
                    <button onClick={() => setShowPersonalityPicker(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                    {AI_PERSONALITIES.map((p) => (
                        <div key={p.id} onClick={() => startSession(p)} className="glass-card p-5 rounded-[30px] border border-white/5 active:scale-95 transition flex items-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mr-4">
                                <i className={`fa-solid ${p.id === 'ravona' ? 'fa-robot' : p.id === 'sarah' ? 'fa-user-tie' : p.id === 'alex' ? 'fa-user-ninja' : 'fa-user-graduate'} text-2xl text-blue-400`}></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-sm uppercase tracking-tight">{p.name}</h4>
                                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">{p.role}</p>
                                <p className="text-[10px] text-slate-500 leading-tight">{p.description}</p>
                            </div>
                            <i className="fa-solid fa-chevron-right text-slate-700 ml-2"></i>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 bg-[#0c1222]">
        <div className="relative w-40 h-40 mb-12">
            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-earth-americas text-5xl text-blue-400 animate-pulse"></i>
            </div>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-widest animate-pulse">Online foydalanuvchi qidirilmoqda...</h2>
        <p className="text-slate-500 text-xs mt-3 uppercase font-bold tracking-[0.2em]">Kuting, hozir kimdir ulanadi!</p>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex flex-col h-full bg-[#0c1222]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="absolute top-10 left-0 right-0 flex flex-col items-center">
                <div className="px-4 py-1.5 bg-blue-600/20 rounded-full border border-blue-500/30 text-blue-400 font-black text-xs">
                    {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                </div>
            </div>

            <div className="w-48 h-48 rounded-[50px] bg-gradient-to-tr from-blue-600/20 to-purple-600/20 p-1 mb-8 shadow-2xl animate-bounce-slow">
                <div className="w-full h-full rounded-[48px] bg-slate-900 flex items-center justify-center border border-white/10 relative overflow-hidden">
                    {partnerInfo.type === 'ai' ? (
                        <i className="fa-solid fa-robot text-7xl text-blue-400"></i>
                    ) : (
                        <span className="text-6xl font-black text-white">{partnerInfo.name.charAt(0)}</span>
                    )}
                </div>
            </div>
            
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">{partnerInfo.name}</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{partnerInfo.level} • {partnerInfo.type === 'ai' ? 'AI Tutor' : 'English Student'}</p>
            
            {/* Wave animation for audio input visual */}
            <div className="mt-8 flex items-center space-x-1 h-8">
               {[1,2,3,4,5,4,3,2,1].map((h, i) => (
                   <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}></div>
               ))}
            </div>
        </div>

        <div className="h-[40%] bg-slate-900/90 backdrop-blur-3xl rounded-t-[50px] border-t border-white/10 p-8 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 no-scrollbar">
                {transcript.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-600 font-bold uppercase text-[10px] tracking-widest text-center">
                       <i className="fa-solid fa-waveform-lines text-2xl mb-2 opacity-30"></i>
                       Gapirishni boshlang, tizim avtomatik eshitadi...
                    </div>
                ) : (
                    transcript.map((t, i) => (
                        <div key={i} className={`flex ${t.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-xs font-bold ${t.sender === 'me' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'}`}>
                                {t.text}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center justify-center">
                <button onClick={endSession} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(220,38,38,0.4)] active:scale-90 transition">
                    <i className="fa-solid fa-phone-slash text-2xl"></i>
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="flex flex-col h-full bg-[#0c1222] p-6 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center py-10">
            <div className="w-24 h-24 rounded-3xl bg-green-500/20 flex items-center justify-center text-green-500 text-4xl mb-6 shadow-lg">
                <i className="fa-solid fa-chart-simple"></i>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Suhbat Tahlili</h2>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Vaqt: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</p>
        </div>

        {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center p-10 glass-card rounded-[35px]">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Xatolar tahlil qilinmoqda...</p>
            </div>
        ) : analysis ? (
            <div className="space-y-6 pb-20">
                {/* Scores Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Grammar', score: analysis.scores?.grammar || 0, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Vocab', score: analysis.scores?.vocabulary || 0, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                        { label: 'Fluency', score: analysis.scores?.fluency || 0, color: 'text-green-400', bg: 'bg-green-400/10' },
                        { label: 'Pronun.', score: analysis.scores?.pronunciation || 0, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    ].map((s, i) => (
                        <div key={i} className={`glass-card rounded-3xl p-4 flex flex-col items-center justify-center border border-white/5 ${s.bg}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${s.color} mb-1`}>{s.label}</span>
                            <span className="text-2xl font-black">{s.score}/10</span>
                        </div>
                    ))}
                </div>

                <div className="glass-card rounded-[35px] p-6 border border-white/5">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Grammatik Xatolar</h3>
                    <div className="space-y-4">
                        {analysis.grammarErrors && analysis.grammarErrors.length > 0 ? analysis.grammarErrors.map((err, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-2xl border-l-4 border-red-500">
                                <p className="text-[10px] text-red-400 line-through mb-1">{err.original}</p>
                                <p className="text-xs font-bold text-green-400 mb-2">{err.corrected}</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">{err.explanation}</p>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-500 italic">Xatolar topilmadi. Ajoyib!</p>
                        )}
                    </div>
                </div>

                <div className="glass-card rounded-[35px] p-6 border border-white/5">
                    <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-4">Talaffuz (Pronunciation)</h3>
                    <div className="space-y-2">
                        {analysis.pronunciationFeedback && analysis.pronunciationFeedback.length > 0 ? analysis.pronunciationFeedback.map((f, i) => (
                            <p key={i} className="text-xs font-bold text-slate-300 flex items-start">
                                <i className="fa-solid fa-circle-dot text-[8px] mt-1.5 mr-2 text-orange-400"></i>
                                {f}
                            </p>
                        )) : (
                            <p className="text-xs text-slate-500 italic">Talaffuzda muammo sezilmadi.</p>
                        )}
                    </div>
                </div>

                <div className="glass-card rounded-[35px] p-6 border border-white/5">
                    <h3 className="text-xs font-black text-green-400 uppercase tracking-widest mb-4">Ravonlik (Fluency)</h3>
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        {analysis.fluencyFeedback || "Siz juda ravon gapirdingiz!"}
                    </p>
                </div>

                <div className="glass-card rounded-[35px] p-6 border border-white/5">
                    <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Tavsiya qilinadigan so'zlar</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis.vocabularySuggestions && analysis.vocabularySuggestions.map((s, i) => (
                            <span key={i} className="px-3 py-1.5 bg-purple-600/10 text-purple-400 rounded-xl text-[10px] font-black border border-purple-500/20">{s}</span>
                        ))}
                    </div>
                </div>

                <div className="glass-card rounded-[35px] p-8 bg-blue-600/10 border border-blue-500/20 flex flex-col items-center">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Suhbat Bahosi</p>
                    <h4 className="text-4xl font-black text-white italic">{analysis.overallLevel || 'Good'}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 tracking-widest">+{Math.max(15, Math.floor(elapsedTime / 60) * 15)} XP ISHLANDI</p>
                </div>

                <button onClick={() => onNavigate('home')} className="w-full liquid-button py-5 rounded-[25px] font-black text-lg uppercase shadow-xl tracking-widest">
                    Asosiyga Qaytish
                </button>
            </div>
        ) : (
            <div className="text-center p-10">
                <p className="text-slate-500 mb-6">Suhbat juda qisqa bo'ldi yoki tahlil amalga oshmadi.</p>
                <button onClick={() => onNavigate('home')} className="w-full liquid-button py-5 rounded-[25px] font-black text-lg">Asosiyga Qaytish</button>
            </div>
        )}
      </div>
    );
  }

  return null;
};

export default SpeakingClub;
