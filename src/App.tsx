import { useState, useEffect } from 'react';
import { User, Quiz, QuizAttempt } from './types';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import QuizList from './components/QuizList';
import QuizPlayer from './components/QuizPlayer';
import MyAttempts from './components/MyAttempts';
import AdminQuizzes from './components/AdminQuizzes';
import AdminAttempts from './components/AdminAttempts';
import { RefreshCw, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('quizzes');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Loaded database state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('quiz_token');
    const savedUserJson = localStorage.getItem('quiz_user');

    if (savedToken && savedUserJson) {
      try {
        const parsedUser = JSON.parse(savedUserJson) as User;
        setToken(savedToken);
        setUser(parsedUser);
        // Verify token with backend
        verifySession(savedToken, parsedUser);
      } catch (e) {
        clearSession();
      }
    }
  }, []);

  // Fetch data when token or user changes
  useEffect(() => {
    if (token && user) {
      fetchQuizzes();
      fetchAttempts();
    }
  }, [token, user]);

  const verifySession = async (authToken: string, sessionUser: User) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) {
        throw new Error('Session expired');
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.warn('Session verification failed, logging out.');
      clearSession();
    }
  };

  const handleAuthSuccess = (authUser: User, authToken: string) => {
    localStorage.setItem('quiz_token', authToken);
    localStorage.setItem('quiz_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
    setCurrentTab('quizzes');
    setActiveQuiz(null);
  };

  const clearSession = () => {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    setToken(null);
    setUser(null);
    setQuizzes([]);
    setAttempts([]);
    setActiveQuiz(null);
    setCurrentTab('quizzes');
  };

  const fetchQuizzes = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quizzes.');
      }
      setQuizzes(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/attempts/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load attempts.');
      }
      setAttempts(data);
    } catch (err: any) {
      console.error('Error fetching attempts:', err);
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
  };

  const handleFinishQuiz = () => {
    setActiveQuiz(null);
    fetchAttempts(); // refresh results on completion
    fetchQuizzes(); // refresh high score statistics
  };

  // If not authenticated, force AuthScreen
  if (!user || !token) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </main>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setActiveQuiz(null); // exit active quiz if switching tabs
        }}
        onLogout={clearSession}
      />

      {/* Main Viewport Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* If user is actively playing a quiz, mount QuizPlayer instead of tabs */}
        {activeQuiz ? (
          <QuizPlayer
            quiz={activeQuiz}
            token={token}
            onFinish={handleFinishQuiz}
          />
        ) : (
          <div className="space-y-6">
            
            {/* Global Error Banner */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="flex-grow">{errorMsg}</span>
                <button
                  onClick={fetchQuizzes}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  Retry Load
                </button>
              </div>
            )}

            {/* TAB ROUTER RENDER */}
            {currentTab === 'quizzes' && (
              <>
                {loading && quizzes.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Syncing Quizzes Database...</p>
                  </div>
                ) : (
                  <QuizList
                    quizzes={quizzes}
                    attempts={attempts}
                    onStartQuiz={handleStartQuiz}
                    user={user}
                    onChangeTab={setCurrentTab}
                  />
                )}
              </>
            )}

            {currentTab === 'attempts' && (
              <MyAttempts
                attempts={attempts}
                onReviewAttempt={() => {}} // Simple review inside card
              />
            )}

            {currentTab === 'admin_quizzes' && user.role === 'admin' && (
              <AdminQuizzes
                quizzes={quizzes}
                token={token}
                onRefresh={() => {
                  fetchQuizzes();
                }}
              />
            )}

            {currentTab === 'admin_attempts' && user.role === 'admin' && (
              <AdminAttempts token={token} />
            )}

          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 QuizSphere Online Quiz System. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Premium Sandbox Learning Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
