import { useState } from 'react';
import { Search, Timer, Award, ClipboardCheck, ArrowRight, Sparkles, Flame, User, Shield } from 'lucide-react';
import { Quiz, QuizAttempt, User as UserType } from '../types';

interface QuizListProps {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onStartQuiz: (quiz: Quiz) => void;
  user?: UserType;
  onChangeTab?: (tab: string) => void;
}

export default function QuizList({ quizzes, attempts, onStartQuiz, user, onChangeTab }: QuizListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Extract unique categories
  const categories = Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean)));

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? quiz.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalPointsEarned = attempts.reduce((sum, att) => sum + att.score, 0);
  const bestScorePercentage = attempts.length > 0 ? Math.max(...attempts.map(a => a.percent)) : 0;
  
  // Find a quiz to feature (first quiz, or first uncompleted, or highest points)
  const featuredQuiz = quizzes.find(q => !attempts.some(a => a.quizId === q.id)) || quizzes[0];
  const featuredQuizPoints = featuredQuiz ? featuredQuiz.questions.reduce((sum, q) => sum + q.points, 0) : 0;

  // Helper to find attempts of a specific quiz
  const getQuizStats = (quizId: string) => {
    const quizAttempts = attempts.filter((a) => a.quizId === quizId);
    if (quizAttempts.length === 0) return null;

    const highestScore = Math.max(...quizAttempts.map((a) => a.percent));
    return {
      attemptsCount: quizAttempts.length,
      highestScore
    };
  };

  return (
    <div id="quiz-list-container" className="space-y-8 animate-fade-in">
      
      {/* Bento Grid Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quiz Catalogue <span className="text-indigo-600">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Select a challenge, test your skills, and earn instant grading scores.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="quiz-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Featured / Active Quiz (Col-span 2) */}
        {featuredQuiz ? (
          <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-lg shadow-indigo-100 min-h-[300px]">
            <div className="z-10">
              <span className="bg-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                FEATURED CHALLENGE
              </span>
              <h2 className="text-3xl font-extrabold mt-4 leading-tight tracking-tight">
                {featuredQuiz.title}
              </h2>
              <p className="text-indigo-100 mt-2 text-sm max-w-md line-clamp-2">
                {featuredQuiz.description || "Start this module to test your understanding and level up your overall stats."}
              </p>
            </div>
            
            <div className="z-10 flex flex-wrap items-end justify-between gap-4 pt-6">
              <div>
                <div className="flex gap-1.5 mb-2">
                  <div className="h-1.5 w-12 bg-white rounded-full"></div>
                  <div className="h-1.5 w-12 bg-white rounded-full"></div>
                  <div className="h-1.5 w-12 bg-indigo-400/60 rounded-full"></div>
                  <div className="h-1.5 w-12 bg-indigo-400/60 rounded-full"></div>
                </div>
                <p className="text-xs text-indigo-100">
                  {featuredQuiz.questions.length} questions • {featuredQuizPoints} max points
                </p>
              </div>
              <button
                id={`btn-featured-start-${featuredQuiz.id}`}
                onClick={() => onStartQuiz(featuredQuiz)}
                className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-1 text-sm shadow-sm"
              >
                Start Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {/* Decorative background circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500 rounded-full opacity-30 pointer-events-none"></div>
            <div className="absolute top-24 -left-12 w-24 h-24 bg-indigo-700 rounded-full opacity-30 pointer-events-none"></div>
          </div>
        ) : (
          <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-8 flex flex-col justify-center items-center text-slate-500 text-center border border-slate-200">
            <Sparkles className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-bold">No Featured Quizzes Available</p>
            <p className="text-xs text-slate-400 mt-1">Check back later or configure an admin quiz.</p>
          </div>
        )}

        {/* Quick Stats: Points (Col-span 1) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
              +{attempts.length * 10} pts
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-800">{totalPointsEarned.toLocaleString()}</p>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Total Score Points</p>
          </div>
        </div>

        {/* Leaderboard Preview (Col-span 1, Row-span 2) */}
        <div className="md:col-span-1 md:row-span-2 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-extrabold text-slate-800 tracking-tight text-sm uppercase text-slate-400 mb-4">Top Achievers</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">1</div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-800">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-400">2,850 pts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">2</div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-800">Alex Rivera</p>
                  <p className="text-[10px] text-slate-400">2,720 pts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-indigo-50/60 rounded-2xl border border-indigo-100/50">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">3</div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-indigo-900 uppercase">You</p>
                  <p className="text-[10px] text-indigo-600 font-semibold">{totalPointsEarned} pts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">4</div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-800">Cody Fisher</p>
                  <p className="text-[10px] text-slate-400">1,940 pts</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onChangeTab && onChangeTab('attempts')}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold mt-4 transition-colors cursor-pointer border border-slate-100"
          >
            Review My Scores
          </button>
        </div>

        {/* Quick Stats: Submissions & Streak (Col-span 1) */}
        <div className="bg-emerald-500 rounded-3xl p-6 text-white flex flex-col justify-between shadow-md shadow-emerald-100/50">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Daily Activity</p>
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black">{attempts.length}</p>
            <p className="text-xs font-medium opacity-90 mt-1">Completed Submissions</p>
          </div>
        </div>

        {/* Subject Explore Categories Section (Col-span 3) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase text-slate-400">Explore Subjects</h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setSelectedCategory(null)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                  : 'bg-slate-50 border-transparent hover:bg-indigo-50/40 hover:border-slate-100'
              }`}
            >
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">CATALOGUE</p>
              <p className={`font-bold text-xs ${selectedCategory === null ? 'text-indigo-600' : 'text-slate-700'}`}>
                All Subjects
              </p>
            </div>

            {categories.slice(0, 3).map((cat) => (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-slate-50 border-transparent hover:bg-indigo-50/40 hover:border-slate-100'
                }`}
              >
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">TOPIC</p>
                <p className={`font-bold text-xs truncate ${selectedCategory === cat ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {cat}
                </p>
              </div>
            ))}

            {/* If not enough topics, show placeholder */}
            {categories.length < 3 && Array.from({ length: 3 - categories.length }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-medium italic">More soon</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Action Card (Col-span 1) */}
        <div 
          onClick={() => {
            if (isAdmin && onChangeTab) {
              onChangeTab('admin_quizzes');
            }
          }}
          className={`bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between border-4 border-slate-800 shadow-md ${
            isAdmin ? 'cursor-pointer hover:border-indigo-500/50 hover:scale-[1.01] transition-all' : ''
          }`}
        >
          <div>
            <div className="w-9 h-9 bg-indigo-500/25 rounded-xl flex items-center justify-center mb-3 text-indigo-400">
              {isAdmin ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <h3 className="font-extrabold text-sm tracking-tight">Question Lab</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isAdmin 
                ? 'Create, edit and delete quizzes for your students.' 
                : 'Complete more challenges to level up your score.'}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold mt-4 pt-3 border-t border-slate-800">
            <span className={isAdmin ? 'text-emerald-400' : 'text-indigo-400'}>
              {isAdmin ? '🛡️ Admin Suite' : '🎓 Student Mode'}
            </span>
            <span className="opacity-60">{isAdmin ? 'Manage →' : 'Learn'}</span>
          </div>
        </div>

      </div>

      {/* FILTERED QUIZZES LIST HEADER */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            {selectedCategory ? `${selectedCategory} Quizzes` : 'Available Quiz Library'}{' '}
            <span className="text-xs font-semibold text-slate-400">({filteredQuizzes.length})</span>
          </h3>
          {search && (
            <span className="text-xs text-slate-400 italic">Filtered by "{search}"</span>
          )}
        </div>

        {/* Grid of Quizzes */}
        {filteredQuizzes.length === 0 ? (
          <div id="no-quizzes-found" className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700">No quizzes match your filters</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search queries or selecting another topic filter.</p>
          </div>
        ) : (
          <div id="quiz-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const stats = getQuizStats(quiz.id);
              const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

              return (
                <div
                  key={quiz.id}
                  id={`quiz-card-${quiz.id}`}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="p-6">
                    {/* Category Header */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] tracking-wide uppercase">
                        {quiz.category || 'General'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Timer className="w-3.5 h-3.5" />
                        {quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'No limit'}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2 min-h-[32px]">
                      {quiz.description || 'No description provided.'}
                    </p>

                    {/* Summary Indicators */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1">
                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                        <span>{quiz.questions.length} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span>{totalPoints} max points</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Stats and Button Footer */}
                  <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-between">
                    {stats ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">Best Score</span>
                        <span className={`text-xs font-bold ${stats.highestScore >= 80 ? 'text-emerald-600' : stats.highestScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {stats.highestScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">Not attempted yet</span>
                    )}

                    <button
                      id={`btn-start-${quiz.id}`}
                      onClick={() => onStartQuiz(quiz)}
                      disabled={quiz.questions.length === 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow group-hover:translate-x-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Start Challenge
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
