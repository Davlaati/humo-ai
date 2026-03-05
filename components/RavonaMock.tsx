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
    question: "If I _____ you, I would study harder for the IELTS exam.",
    options: ["am", "was", "were", "would be"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "She _____ to the cinema every Friday, but this week she's staying home.",
    options: ["go", "goes", "is going", "went"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "By the time we arrive, the movie _____.",
    options: ["will start", "will have started", "starts", "has started"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "I'm looking forward _____ you at the party.",
    options: ["to see", "to seeing", "see", "seeing"],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "Neither the teacher nor the students _____ the answer.",
    options: ["know", "knows", "are knowing", "is knowing"],
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
    const finalScore = Math.round((score + (questions[currentQuestion].correctAnswer === -1 ? 0 : 0)) / questions.length * 12); // Simple mapping to 1-12
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
