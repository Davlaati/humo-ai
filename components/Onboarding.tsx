import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, EnglishLevel, TeachingPersonality } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const steps = [
  'Language',
  'Welcome',
  'Name',
  'Age',
  'Level',
  'Goal',
  'Personality',
  'Schedule',
  'Frequency',
  'Interests',
  'Summary',
  'Loading'
];

type LangKey = 'Uz' | 'Ru' | 'Eng';

const TRANSLATIONS: Record<string, Record<LangKey, string>> = {
  welcome_title: { Uz: "Salom, men Humo AI", Ru: "Привет, я Humo AI", Eng: "Hi, I'm Humo AI" },
  welcome_desc: { Uz: "Keling, shaxsiy o'quv rejangizni tuzamiz.", Ru: "Давайте составим ваш персональный план обучения.", Eng: "Let's create your personalized learning plan." },
  welcome_btn: { Uz: "Boshladik!", Ru: "Поехали!", Eng: "Let's Go!" },
  name_title: { Uz: "Ismingiz nima?", Ru: "Как вас зовут?", Eng: "What's your name?" },
  name_placeholder: { Uz: "Ismingiz", Ru: "Ваше имя", Eng: "Your Name" },
  age_title: { Uz: "Yoshingiz nechada?", Ru: "Сколько вам лет?", Eng: "How old are you?" },
  level_title: { Uz: "Ingliz tili darajangiz", Ru: "Ваш уровень английского", Eng: "Current English Level" },
  goal_title: { Uz: "Nima uchun o'rganmoqchisiz?", Ru: "Почему вы хотите учиться?", Eng: "Why do you want to learn?" },
  goal_placeholder: { Uz: "Sayohat, ish, o'qish uchun...", Ru: "Для путешествий, работы...", Eng: "I want to travel, work abroad..." },
  personality_title: { Uz: "Ustoz uslubini tanlang", Ru: "Выберите стиль учителя", Eng: "Choose Tutor Style" },
  schedule_title: { Uz: "Kunlik dars vaqti", Ru: "Ежедневное время обучения", Eng: "Daily Study Time" },
  frequency_title: { Uz: "Mashg'ulotlar chastotasi", Ru: "Частота занятий", Eng: "Practice Frequency" },
  interests_title: { Uz: "Qiziqishlaringizni tanlang (kamida 3ta)", Ru: "Выберите интересы (мин. 3)", Eng: "Select Interests (min 3)" },
  summary_title: { Uz: "Ajoyib, {name}!", Ru: "Отлично, {name}!", Eng: "Awesome, {name}!" },
  summary_hold: { Uz: "DNA yaratish uchun bosib turing", Ru: "Удерживайте для создания DNA", Eng: "Press and hold to create your DNA" },
  continue_btn: { Uz: "Davom etish", Ru: "Продолжить", Eng: "Continue" },
  lang_selection: { Uz: "Tilni tanlang", Ru: "Выберите язык", Eng: "Select Language" }
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<LangKey>('Eng');
  const [data, setData] = useState<Partial<UserProfile>>({
    coins: 0,
    xp: 0,
    streak: 0,
    joinedAt: new Date().toISOString(),
    personalities: [],
    interests: [],
    age: '20'
  });
  const [loadingText, setLoadingText] = useState('Loading...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const t = (key: string) => TRANSLATIONS[key]?.[selectedLang] || TRANSLATIONS[key]?.['Eng'] || key;

  const next = () => setStep(s => s + 1);

  const selectLanguage = (l: LangKey) => {
    setSelectedLang(l);
    next();
  };

  useEffect(() => {
    if (steps[step] === 'Loading') {
      const texts = selectedLang === 'Uz' ? [
        'Shaxsiy interfeys yaratilmoqda...',
        'O\'quv yo\'li tahlil qilinmoqda...',
        'Humobek tayyorlanmoqda...',
        'Deyarli tayyor...'
      ] : selectedLang === 'Ru' ? [
        'Создание персонального интерфейса...',
        'Анализ лучшего пути обучения...',
        'Подготовка Humobek...',
        'Почти готово...'
      ] : [
        'Creating your personalized interface...',
        'Analyzing best learning path...',
        'Preparing Humobek...',
        'Almost there...'
      ];
      let textIndex = 0;
      setLoadingText(texts[0]);
      setLoadingProgress(0);

      const totalDuration = 5000;
      const intervalTime = 50; 
      const stepsCount = totalDuration / intervalTime;
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min((currentStep / stepsCount) * 100, 100);
        setLoadingProgress(progress);

        if (currentStep % 30 === 0 && textIndex < texts.length - 1) {
            textIndex++;
            setLoadingText(texts[textIndex]);
        }

        if (currentStep >= stepsCount) {
          clearInterval(progressInterval);
          setTimeout(() => {
             onComplete(data as UserProfile);
          }, 300);
        }
      }, intervalTime);

      return () => clearInterval(progressInterval);
    }
  }, [step, onComplete, data, selectedLang]);

  const BackgroundDecor = () => (
    <>
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-purple-600 rounded-full blur-[100px] opacity-20 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
    </>
  );

  const renderStep = () => {
    const currentStepName = steps[step];

    switch (currentStepName) {
      case 'Language':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in p-6 relative z-10">
            <h1 className="text-3xl font-bold mb-8">{t('lang_selection')}</h1>
            <button onClick={() => selectLanguage('Uz')} className="w-full py-4 glass-card rounded-xl text-lg font-semibold hover:bg-white/10 transition active:scale-95">O'zbekcha</button>
            <button onClick={() => selectLanguage('Ru')} className="w-full py-4 glass-card rounded-xl text-lg font-semibold hover:bg-white/10 transition active:scale-95">Русский</button>
            <button onClick={() => selectLanguage('Eng')} className="w-full py-4 glass-card rounded-xl text-lg font-semibold hover:bg-white/10 transition active:scale-95">English</button>
          </div>
        );
      
      case 'Welcome':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 relative z-10 animate-fade-in">
            <div className="w-32 h-32 bg-blue-500 rounded-full blur-2xl absolute opacity-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <i className="fa-solid fa-feather-pointed text-6xl text-blue-400 mb-6 relative z-10"></i>
            <h1 className="text-4xl font-bold mb-2">{t('welcome_title')}</h1>
            <p className="text-gray-300 mb-10">{t('welcome_desc')}</p>
            <button onClick={next} className="w-full liquid-button py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition">{t('welcome_btn')}</button>
          </div>
        );

      case 'Name':
        return (
          <StepLayout title={t('name_title')} onNext={next} disableNext={!data.name} btnText={t('continue_btn')}>
            <input 
              type="text" 
              value={data.name || ''}
              onChange={e => setData({...data, name: e.target.value, username: e.target.value.toLowerCase().replace(/\s/g, '_')})}
              className="w-full bg-transparent border-b-2 border-white/30 text-3xl py-2 focus:outline-none focus:border-blue-400 text-center"
              placeholder={t('name_placeholder')}
              autoFocus
            />
          </StepLayout>
        );

      case 'Age':
        // Modern Age Picker: Grid of numbers from 10 to 60
        const ages = Array.from({ length: 51 }, (_, i) => (i + 10).toString());
        return (
          <StepLayout title={t('age_title')} onNext={next} disableNext={!data.age} btnText={t('continue_btn')}>
            <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-4 glass-panel rounded-2xl no-scrollbar">
              {ages.map(a => (
                <button 
                  key={a}
                  onClick={() => setData({...data, age: a})}
                  className={`aspect-square flex items-center justify-center rounded-lg text-lg font-bold transition-all ${data.age === a ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center">
              <span className="text-blue-400 text-3xl font-black">{data.age}</span>
            </div>
          </StepLayout>
        );

      case 'Level':
        return (
          <StepLayout title={t('level_title')} onNext={next} disableNext={!data.level} btnText={t('continue_btn')}>
            <div className="space-y-3 w-full">
              {Object.values(EnglishLevel).map(lvl => (
                <button 
                  key={lvl}
                  onClick={() => setData({...data, level: lvl})}
                  className={`w-full py-3 px-4 rounded-xl text-left transition active:scale-95 ${data.level === lvl ? 'bg-blue-600 border border-blue-400' : 'glass-card'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </StepLayout>
        );

      case 'Goal':
        return (
           <StepLayout title={t('goal_title')} onNext={next} disableNext={!data.goal} btnText={t('continue_btn')}>
             <textarea 
               value={data.goal || ''}
               onChange={e => setData({...data, goal: e.target.value})}
               className="w-full h-32 glass-panel rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder={t('goal_placeholder')}
             />
           </StepLayout>
        );
      
      case 'Personality':
        const opts: TeachingPersonality[] = ['Kind', 'Strict', 'Relaxed', 'Demanding', 'Playful', 'Serious', 'Energetic', 'Calm'];
        const toggleP = (p: TeachingPersonality) => {
          const current = data.personalities || [];
          if (current.includes(p)) {
            setData({...data, personalities: current.filter(x => x !== p)});
          } else {
            setData({...data, personalities: [...current, p]});
          }
        };
        return (
          <StepLayout title={t('personality_title')} onNext={next} disableNext={(data.personalities?.length || 0) < 1} btnText={t('continue_btn')}>
            <div className="grid grid-cols-2 gap-3 w-full">
              {opts.map(p => (
                <button
                  key={p}
                  onClick={() => toggleP(p)}
                  className={`py-3 rounded-xl font-medium transition active:scale-95 ${data.personalities?.includes(p) ? 'bg-purple-600 text-white shadow-lg' : 'glass-card text-gray-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </StepLayout>
        );

      case 'Schedule':
        const times = [10, 20, 30, 45, 60];
        return (
          <StepLayout title={t('schedule_title')} onNext={next} disableNext={!data.studyMinutes} btnText={t('continue_btn')}>
            <div className="space-y-4 w-full">
              {times.map(t_val => (
                <button
                  key={t_val}
                  onClick={() => setData({...data, studyMinutes: t_val})}
                  className={`w-full py-4 rounded-xl text-xl font-bold transition active:scale-95 ${data.studyMinutes === t_val ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'glass-card'}`}
                >
                  {t_val} min
                </button>
              ))}
            </div>
          </StepLayout>
        );

      case 'Frequency':
        const freqs = selectedLang === 'Uz' ? ['Har kuni', 'Haftada 3 kun', 'Dam olish kunlari', 'Ixtiyoriy'] : selectedLang === 'Ru' ? ['Ежедневно', '3 раза в неделю', 'По выходным', 'Гибкий график'] : ['Daily', '3x Week', 'Weekends', 'Flexible'];
        return (
          <StepLayout title={t('frequency_title')} onNext={next} disableNext={!data.practiceFrequency} btnText={t('continue_btn')}>
             <div className="space-y-4 w-full">
              {freqs.map(f => (
                <button
                  key={f}
                  onClick={() => setData({...data, practiceFrequency: f})}
                  className={`w-full py-4 rounded-xl text-xl font-bold transition active:scale-95 ${data.practiceFrequency === f ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'glass-card'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </StepLayout>
        );

      case 'Interests':
        const interestList = ['Technology', 'Business', 'Travel', 'Movies', 'Music', 'Sports', 'Gaming', 'Food', 'Fashion', 'Art', 'Science', 'History'];
        const toggleI = (i: string) => {
          const current = data.interests || [];
          if (current.includes(i)) setData({...data, interests: current.filter(x => x !== i)});
          else if (current.length < 8) setData({...data, interests: [...current, i]});
        };
        return (
          <StepLayout title={t('interests_title')} onNext={next} disableNext={(data.interests?.length || 0) < 3} btnText={t('continue_btn')}>
             <div className="flex flex-wrap gap-2 justify-center">
              {interestList.map(i => (
                <button
                  key={i}
                  onClick={() => toggleI(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition active:scale-95 ${data.interests?.includes(i) ? 'bg-white text-blue-900' : 'bg-white/10 text-white'}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </StepLayout>
        );

      case 'Summary':
        return (
          <div className="flex flex-col h-full p-6 animate-fade-in relative z-10">
            <h2 className="text-2xl font-bold mb-6">{t('summary_title').replace('{name}', data.name || '')}</h2>
            <div className="glass-card p-6 rounded-2xl space-y-4 flex-1 mb-8">
              <Row label="Level" value={data.level || ''} />
              <Row label="Goal" value="Mastery" />
              <Row label="Style" value={data.personalities?.join(', ') || ''} />
              <Row label="Schedule" value={`${data.practiceFrequency}, ${data.studyMinutes}m`} />
            </div>
            <div className="text-center pb-8">
               <p className="text-sm text-gray-400 mb-4 animate-pulse">{t('summary_hold')}</p>
               <FingerprintButton onComplete={next} />
            </div>
          </div>
        );

      case 'Loading':
        return (
           <div className="flex flex-col items-center justify-center h-full relative z-10 animate-fade-in px-8">
             <div className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center shadow-2xl backdrop-blur-xl border border-white/20">
               <div className="relative w-20 h-20 mb-6">
                 <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <i className="fa-solid fa-bolt text-2xl text-blue-400 animate-pulse"></i>
                 </div>
               </div>
               
               <h2 className="text-lg font-medium text-center h-16 flex items-center justify-center transition-all duration-300">
                 {loadingText}
               </h2>

               <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mt-6">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-100 ease-linear"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
               </div>
             </div>
           </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-white overflow-hidden relative">
      <BackgroundDecor />
      {renderStep()}
    </div>
  );
};

const StepLayout: React.FC<{ title: string; children: React.ReactNode; onNext: () => void; disableNext: boolean; btnText: string }> = ({ title, children, onNext, disableNext, btnText }) => (
  <div className="flex flex-col h-full p-6 animate-fade-in relative z-10">
    <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">
      <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
      {children}
    </div>
    <div className="pt-6">
      <button 
        onClick={onNext}
        disabled={disableNext}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95 ${disableNext ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'liquid-button text-white shadow-lg'}`}
      >
        {btnText}
      </button>
    </div>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-white/10 pb-2 last:border-0">
    <span className="text-gray-400">{label}</span>
    <span className="font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);

const FingerprintButton: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [holding, setHolding] = useState(false);
  const [complete, setComplete] = useState(false);
  
  useEffect(() => {
    let timer: any;
    if (holding && !complete) {
      timer = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setComplete(true);
        setTimeout(onComplete, 200); 
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [holding, complete, onComplete]);

  return (
    <button
      onMouseDown={() => setHolding(true)}
      onMouseUp={() => setHolding(false)}
      onMouseLeave={() => setHolding(false)}
      onTouchStart={() => setHolding(true)}
      onTouchEnd={() => setHolding(false)}
      className={`relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden mx-auto transition-transform duration-200 ${holding ? 'scale-110' : 'scale-100'} glass-panel border border-white/20`}
    >
      <i className={`fa-solid fa-fingerprint text-5xl z-10 transition-colors duration-500 ${complete ? 'text-green-400' : holding ? 'text-blue-400' : 'text-gray-400'}`}></i>
      
      {holding && !complete && <div className="absolute inset-0 bg-blue-500/20 fingerprint-scan"></div>}
      
      {complete && <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>}

      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
        <circle cx="48" cy="48" r="46" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
        {holding && !complete && (
          <circle 
            cx="48" cy="48" r="46" 
            stroke="currentColor" strokeWidth="3" fill="transparent" 
            className="text-blue-500 transition-all ease-linear"
            strokeDasharray="289"
            strokeDashoffset="289"
            style={{ animation: 'dash 3s linear forwards' }}
          />
        )}
      </svg>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </button>
  );
};

export default Onboarding;