
import React, { useState, useEffect } from 'react';
import { UserProfile, LibraryItem, LibraryItemType, EnglishLevel } from '../types';
import { fetchLibraryItemsFromSupabase } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';
import { playTapSound } from '../services/audioService';

interface LibraryProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

const Library: React.FC<LibraryProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<LibraryItemType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [activeLesson, setActiveLesson] = useState<number>(0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await fetchLibraryItemsFromSupabase();
    setItems(data.filter(i => i.isActive));
    setLoading(false);
  };

  const filteredItems = activeType === 'all' 
    ? items 
    : items.filter(i => i.type === activeType);

  const handleItemClick = (item: LibraryItem) => {
    playTapSound();
    setSelectedItem(item);
    setActiveLesson(0);
  };

  if (selectedItem) {
    return (
      <div className="flex flex-col h-full bg-[#0c1222] animate-fade-in">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center space-x-4 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition">
            <i className="fa-solid fa-chevron-left text-white"></i>
          </button>
          <div>
            <h1 className="text-lg font-black italic uppercase tracking-tighter text-white truncate max-w-[200px]">{selectedItem.title}</h1>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{selectedItem.type}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
          {selectedItem.type === 'course' && selectedItem.lessons && selectedItem.lessons.length > 0 ? (
            <div className="space-y-6">
              {/* Lesson Video/Content */}
              <div className="glass-card rounded-3xl overflow-hidden mb-6">
                {selectedItem.lessons[activeLesson].videoUrl ? (
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <iframe 
                      src={selectedItem.lessons[activeLesson].videoUrl} 
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-8 text-center">
                    <i className="fa-solid fa-book-open text-5xl text-white/20 absolute"></i>
                    <p className="relative z-10 text-white font-medium">{selectedItem.lessons[activeLesson].description}</p>
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">{selectedItem.lessons[activeLesson].title}</h2>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    {selectedItem.lessons[activeLesson].content}
                  </div>
                </div>
              </div>

              {/* Lesson List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Darslar</h3>
                {selectedItem.lessons.sort((a,b) => a.order - b.order).map((lesson, idx) => (
                  <button 
                    key={lesson.id}
                    onClick={() => setActiveLesson(idx)}
                    className={`w-full p-4 rounded-2xl flex items-center space-x-4 transition-all ${
                      activeLesson === idx 
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-800/50 border border-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                      activeLesson === idx ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-bold ${activeLesson === idx ? 'text-white' : 'text-slate-200'}`}>{lesson.title}</p>
                      <p className={`text-[10px] ${activeLesson === idx ? 'text-blue-200' : 'text-slate-500'}`}>{lesson.description}</p>
                    </div>
                    {activeLesson === idx && <i className="fa-solid fa-play text-xs text-white animate-pulse"></i>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="glass-card rounded-3xl overflow-hidden">
                <img src={selectedItem.thumbnail} alt={selectedItem.title} className="w-full aspect-video object-cover" />
                <div className="p-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                      {selectedItem.level}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{selectedItem.title}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">{selectedItem.description}</p>
                  
                  {selectedItem.contentUrl && (
                    <a 
                      href={selectedItem.contentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl liquid-button text-white font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3"
                    >
                      <i className={`fa-solid ${selectedItem.type === 'podcast' ? 'fa-play' : 'fa-download'}`}></i>
                      <span>{selectedItem.type === 'podcast' ? 'Tinglash' : 'Yuklab olish / O\'qish'}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0c1222] animate-fade-in">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Kutubxona</h1>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bilimlar xazinasi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <i className="fa-solid fa-book-bookmark text-blue-400 text-xl"></i>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
          <CategoryTab active={activeType === 'all'} label="Barchasi" onClick={() => setActiveType('all')} />
          <CategoryTab active={activeType === 'course'} label="Kurslar" onClick={() => setActiveType('course')} />
          <CategoryTab active={activeType === 'podcast'} label="Podcastlar" onClick={() => setActiveType('podcast')} />
          <CategoryTab active={activeType === 'book'} label="Kitoblar" onClick={() => setActiveType('book')} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Yuklanmoqda...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleItemClick(item)}
                className="glass-card rounded-[32px] overflow-hidden group border border-white/5 hover:border-blue-500/30 transition-all"
              >
                <div className="relative aspect-video">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                      {item.level}
                    </span>
                  </div>
                  {item.isPremium && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <i className="fa-solid fa-crown text-white text-xs"></i>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className={`fa-solid ${
                        item.type === 'course' ? 'fa-graduation-cap' : 
                        item.type === 'podcast' ? 'fa-microphone' : 'fa-book'
                      } text-blue-400 text-xs`}></i>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{item.type}</span>
                    </div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white leading-tight">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <i className="fa-solid fa-folder-open text-slate-600 text-2xl"></i>
            </div>
            <p className="text-slate-400 font-bold">Hozircha hech narsa yo'q</p>
            <p className="text-slate-600 text-xs mt-1">Tez orada yangi materiallar qo'shiladi</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryTab: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
      active 
        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
        : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-800'
    }`}
  >
    {label}
  </button>
);

export default Library;
