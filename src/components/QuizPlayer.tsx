import { useState, useEffect, useRef } from 'react';
import { Timer, ArrowRight, ArrowLeft, Send, CheckCircle2, XCircle, AlertTriangle, RefreshCw, LogIn, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { Quiz, Question } from '../types';

interface QuizPlayerProps {
  quiz: Quiz;
  token: string;
  onFinish: () => void;
}

export default function QuizPlayer({ quiz, token, onFinish }: QuizPlayerProps) {
  const [step, setStep] = useState<'intro' | 'playing' | 'results'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<any | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize time limit
  useEffect(() => {
    if (quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
    }
    return () => stopTimer();
  }, [quiz]);

  // Countdown timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            // Auto submit when time runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft]);

  const startQuiz = () => {
    setStep('playing');
    setCurrentIndex(0);
    setAnswers({});
    setGradingResult(null);
    setWarningMsg(null);
    if (quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
      setTimerActive(true);
    }
  };

  const stopTimer = () => {
    setTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
    setWarningMsg(null);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = async () => {
    setWarningMsg('Time is up! Auto-submitting your answers...');
    submitAnswers();
  };

  const submitAnswers = async () => {
    stopTimer();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answers.');
      }

      setGradingResult(data);
      setStep('results');
    } catch (err: any) {
      setWarningMsg(`Submission error: ${err.message}. Please click try again.`);
      setTimerActive(true); // resume timer as fallback
    } finally {
      setSubmitting(false);
    }
  };

  const checkUnansweredAndSubmit = () => {
    const unansweredCount = quiz.questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      if (confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`)) {
        submitAnswers();
      }
    } else {
      submitAnswers();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = quiz.questions[currentIndex];

  // Helper styles for score ranges
  const getScoreColor = (percent: number) => {
    if (percent >= 80) return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-600', fill: '#10b981' };
    if (percent >= 50) return { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-500', fill: '#f59e0b' };
    return { bg: 'bg-red-50 text-red-800 border-red-200', text: 'text-red-600', fill: '#ef4444' };
  };

  return (
    <div id="quiz-player-outer" className="max-w-3xl mx-auto">
      {/* STEP 1: INTRO SCREEN */}
      {step === 'intro' && (
        <div id="quiz-intro-card" className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-xs uppercase tracking-wider">
              {quiz.category || 'General'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-2">{quiz.title}</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">{quiz.description || 'No description provided.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 text-left">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Duration</span>
                <span className="text-sm font-bold text-slate-700">
                  {quiz.timeLimit > 0 ? `${quiz.timeLimit} Minutes` : 'Unlimited Time'}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Questions</span>
                <span className="text-sm font-bold text-slate-700">
                  {quiz.questions.length} Questions
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-center gap-3">
            <button
              id="btn-intro-back"
              onClick={onFinish}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-intro-start"
              onClick={startQuiz}
              disabled={quiz.questions.length === 0}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Begin Quiz <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE GAMEPLAY */}
      {step === 'playing' && currentQuestion && (
        <div id="quiz-playing-card" className="space-y-6">
          
          {/* Header Row: Quiz title and countdown timer */}
          <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="truncate pr-4">
              <h3 className="font-bold text-slate-800 text-base truncate">{quiz.title}</h3>
              <p className="text-xs text-slate-400 font-medium">Question {currentIndex + 1} of {quiz.questions.length}</p>
            </div>

            {/* Timer Box */}
            {quiz.timeLimit > 0 && (
              <div id="quiz-timer" className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold shrink-0 ${
                timeLeft < 60
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
                <Timer className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {warningMsg && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Question body card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Point Indicator & Text */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {currentQuestion.points} Points
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
                  {currentQuestion.text}
                </h4>
              </div>

              {/* Options or Text Area Input */}
              <div className="pt-2">
                {/* MULTIPLE CHOICE OR TRUE/FALSE */}
                {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <button
                          key={idx}
                          id={`option-${idx}`}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                          className={`w-full p-4 text-left rounded-xl border font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 font-semibold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{option}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* SHORT ANSWER */}
                {currentQuestion.type === 'short_answer' && (
                  <div className="space-y-2">
                    <input
                      id={`input-short-ans-${currentQuestion.id}`}
                      type="text"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                    />
                    <p className="text-[10px] text-slate-400">Note: Grading is case-insensitive, but make sure to spell carefully!</p>
                  </div>
                )}
              </div>

            </div>

            {/* Question Footer Navigation */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <button
                id="btn-player-prev"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex gap-2">
                {currentIndex < quiz.questions.length - 1 ? (
                  <button
                    id="btn-player-next"
                    onClick={handleNext}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id="btn-player-submit"
                    onClick={checkUnansweredAndSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Answers
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Quick Jump Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Question Navigator</span>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    id={`btn-jump-${idx}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                        : isAnswered
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* STEP 3: RESULTS & GRADING SCREEN */}
      {step === 'results' && gradingResult && (
        <div id="quiz-results-card" className="space-y-6">
          
          {/* Main Score Board */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-white text-center space-y-4">
              <span className="px-3 py-1 bg-white/20 text-white font-bold rounded-full text-xs uppercase tracking-wider">
                Results Summary
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Quiz Submitted Successfully!</h2>
              
              {/* Circular Gauge */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center bg-white/10 rounded-full border border-white/20 shadow-inner mt-4">
                <div className="text-center">
                  <span className="text-4xl font-extrabold block">{gradingResult.percent}%</span>
                  <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wide">Grade</span>
                </div>
              </div>

              {/* Score text */}
              <p className="text-lg font-medium text-indigo-100">
                You scored <span className="font-bold text-white">{gradingResult.score}</span> out of{' '}
                <span className="font-bold text-white">{gradingResult.totalPoints}</span> points.
              </p>
            </div>

            {/* Review summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
              <div className="bg-white p-6 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pass Status</span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {gradingResult.percent >= 50 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-emerald-600 text-lg">Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="font-bold text-red-500 text-lg">Needs Practice</span>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-white p-6 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Submitted On</span>
                <span className="block text-slate-700 font-bold mt-1 text-sm">
                  {new Date(gradingResult.completedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Back Button */}
            <div className="p-4 bg-slate-50 flex justify-center">
              <button
                id="btn-results-catalogue"
                onClick={onFinish}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                Return to Catalogue
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Question-by-Question Breakdown
            </h3>

            {gradingResult.gradedQuestions && gradingResult.gradedQuestions.map((gq: any, idx: number) => {
              const scoreStyle = getScoreColor(gq.isCorrect ? 100 : 0);

              return (
                <div
                  key={gq.id}
                  id={`review-question-${gq.id}`}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${scoreStyle.bg}`}>
                    <span className="text-xs font-bold">Question {idx + 1}</span>
                    <span className="text-xs font-bold">
                      {gq.isCorrect ? `${gq.points}/${gq.points} Points` : `0/${gq.points} Points`}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{gq.text}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Your Answer */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-400 uppercase block tracking-wider mb-1">Your Answer</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          {gq.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className={`font-semibold ${gq.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            {gq.userAnswer || <span className="italic text-slate-400">Empty (Unanswered)</span>}
                          </span>
                        </div>
                      </div>

                      {/* Correct Answer */}
                      {!gq.isCorrect && (
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                          <span className="font-bold text-emerald-800/60 uppercase block tracking-wider mb-1">Correct Answer</span>
                          <div className="flex items-center gap-2 mt-1.5 text-emerald-800 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{gq.correctAnswer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
