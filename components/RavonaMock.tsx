import React, { useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  {
    id: 1,
    question: "Choose the correct form: 'By the time the teacher arrived, the students _____ the grammar exercise.'",
    options: ["already finished", "had already finished", "have already finished", "already finish"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Identify the correct sentence structure: '_____ she studied hard, she didn't pass the exam.'",
    options: ["Despite", "Although", "In spite of", "However"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Select the correct conditional: 'If I _____ you, I would have accepted the job offer.'",
    options: ["was", "were", "had been", "would be"],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "Choose the correct preposition: 'He is very good _____ solving complex linguistic problems.'",
    options: ["at", "in", "on", "with"],
    correctAnswer: 0
  },
  {
    id: 5,
    question: "Select the correct relative clause: 'The man _____ I spoke to yesterday is the CEO.'",
    options: ["who", "which", "whom", "whose"],
    correctAnswer: 2
  },
  {
    id: 6,
    question: "Choose the correct passive voice: 'The report _____ by the committee by tomorrow morning.'",
    options: ["will be completed", "will have been completed", "is completed", "has been completed"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "Identify the correct modal verb: 'You _____ have told me about the meeting; I was waiting for hours!'",
    options: ["must", "should", "could", "might"],
    correctAnswer: 1
  },
  {
    id: 8,
    question: "Choose the correct gerund/infinitive: 'She stopped _____ to her friend because she was late.'",
    options: ["to talk", "talking", "talk", "talked"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "Select the correct inversion: '_____ had I left the house than it started to rain.'",
    options: ["No sooner", "Hardly", "Scarcely", "Not only"],
    correctAnswer: 0
  },
  {
    id: 10,
    question: "Choose the correct causative: 'I need to _____ my car _____ tomorrow.'",
    options: ["have / repaired", "get / repair", "have / repair", "get / to repair"],
    correctAnswer: 0
  }
];

const RavonaMock: React.FC<{ user: UserProfile; onUpdateUser: (user: UserProfile) => void; onNavigate: (tab: string) => void }> = ({ user, onUpdateUser, onNavigate }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (index: number) => {
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    // Map score (0-10) to 1-12 scale
    // 0 correct -> 1, 10 correct -> 12
    const finalScore = Math.round(1 + (score / questions.length) * 11);
    const ravonaScore = Math.max(1, Math.min(12, finalScore));
    onUpdateUser({ ...user, ravonaScore });
    setFinished(true);
  };

  const getIELTS = (score: number) => {
    if (score >= 11) return '8.5 - 9.0';
    if (score >= 9) return '7.0 - 8.0';
    if (score >= 7) return '5.5 - 6.5';
    if (score >= 5) return '4.0 - 5.0';
    return 'Below 4.0';
  };

  if (finished) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Exam Finished!</h2>
        <div className="text-6xl font-black text-blue-500 mb-2">{user.ravonaScore}</div>
        <p className="text-xl mb-4">Ravona Score</p>
        <p className="text-lg text-slate-400">IELTS Equivalent: {getIELTS(user.ravonaScore!)}</p>
        <button onClick={() => onNavigate('home')} className="mt-8 bg-blue-600 px-6 py-3 rounded-xl text-white">Back Home</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Ravona Grammar Mock</h2>
      <div className="mb-4 text-sm text-slate-400">Question {currentQuestion + 1} of {questions.length}</div>
      <p className="text-lg mb-6">{questions[currentQuestion].question}</p>
      <div className="space-y-3">
        {questions[currentQuestion].options.map((option, index) => (
          <button key={index} onClick={() => handleAnswer(index)} className="w-full p-4 bg-slate-800 rounded-xl text-left">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RavonaMock;
