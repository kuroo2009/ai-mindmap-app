"use client";
import React, { useState } from 'react';

interface QuizProps {
  questions: any[];
}

export default function Quiz({ questions = [] }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (questions.length === 0) return null;

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; // Không cho chọn lại

    setSelectedAnswer(option);
    const correct = option === questions[currentQuestion].correct_answer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    // Chuyển câu hỏi sau 1.5 giây
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-blue-500">
        <h2 className="text-3xl font-bold text-gray-800">Kết quả: {score}/{questions.length}</h2>
        <p className="mt-2 text-gray-600">
          {score === questions.length ? "🌟 Thiên tài! Bạn đã nắm vững kiến thức." : "📚 Khá tốt, nhưng cần xem lại sơ đồ một chút nhé!"}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          Làm lại từ đầu
        </button>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">Câu hỏi {currentQuestion + 1}/{questions.length}</span>
        <span className="text-sm text-gray-400">Đúng: {score}</span>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{q.question}</h3>

      <div className="grid grid-cols-1 gap-3">
        {q.options.map((option: string) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className={`p-4 text-left rounded-xl border-2 transition-all ${
              selectedAnswer === option
                ? isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                : "border-gray-100 hover:border-blue-200 hover:bg-blue-50"
            }`}
          >
            <span className="font-medium">{option}</span>
          </button>
        ))}
      </div>

      {isCorrect !== null && (
        <p className={`mt-4 text-center font-bold ${isCorrect ? "text-green-500" : "text-red-500"}`}>
          {isCorrect ? "Chính xác! 🎉" : `Sai rồi! Đáp án là: ${q.correct_answer}`}
        </p>
      )}
    </div>
  );
}