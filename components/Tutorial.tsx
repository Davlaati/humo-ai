import React, { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
}

const steps = [
  { title: "Welcome!", desc: "Welcome to Ravona AI. Let's show you around." },
  { title: "Home", desc: "This is your home screen where you can see your progress." },
  { title: "Learn", desc: "Access your lessons here." },
  { title: "Games", desc: "Play games to practice your English." },
  { title: "Profile", desc: "Manage your settings and subscription here." }
];

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/80 flex items-center justify-center p-6 animate-fade-in">
      <div className="glass-card w-full max-w-sm p-8 rounded-3xl text-center border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">{steps[step].title}</h2>
        <p className="text-gray-300 mb-8">{steps[step].desc}</p>
        <div className="flex gap-4">
          <button onClick={onComplete} className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition">Skip</button>
          <button onClick={next} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition">{step === steps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
