import { LogOut, BookOpen, History, Shield, Users } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, currentTab, onChangeTab, onLogout }: NavbarProps) {
  const isAdmin = user.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Brand Logo - Styled like Quizzly.ai from the bento design */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChangeTab('quizzes')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-100">
              Q
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                QuizSphere<span className="text-indigo-600 font-black">.ai</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Learning System</p>
            </div>
          </div>

          {/* Navigation Controls - Sleek, flat, aligned tab controls */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500">
            <button
              id="nav-quizzes"
              onClick={() => onChangeTab('quizzes')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                currentTab === 'quizzes'
                  ? 'text-indigo-600 border-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Catalogue
            </button>

            <button
              id="nav-my-scores"
              onClick={() => onChangeTab('attempts')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                currentTab === 'attempts'
                  ? 'text-indigo-600 border-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Scores
            </button>

            {isAdmin && (
              <>
                <button
                  id="nav-admin-quizzes"
                  onClick={() => onChangeTab('admin_quizzes')}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    currentTab === 'admin_quizzes'
                      ? 'text-indigo-600 border-indigo-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Manage Quizzes
                </button>

                <button
                  id="nav-admin-scores"
                  onClick={() => onChangeTab('admin_attempts')}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    currentTab === 'admin_attempts'
                      ? 'text-indigo-600 border-indigo-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Global Directory
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout - styled to match Sarah Jenkins block in design */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-slate-800">{user.username}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                {isAdmin ? '🛡️ Admin Account' : '🎓 Level 14 Pro'}
              </p>
            </div>

            {/* Initial Bubble Avatar */}
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-extrabold text-sm select-none">
              {user.username.slice(0, 2).toUpperCase()}
            </div>

            {/* Logout icon */}
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-100 py-3 justify-around">
          <button
            id="mobile-nav-quizzes"
            onClick={() => onChangeTab('quizzes')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
              currentTab === 'quizzes' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Quizzes
          </button>
          <button
            id="mobile-nav-scores"
            onClick={() => onChangeTab('attempts')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
              currentTab === 'attempts' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            Scores
          </button>
          {isAdmin && (
            <>
              <button
                id="mobile-nav-admin-quizzes"
                onClick={() => onChangeTab('admin_quizzes')}
                className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  currentTab === 'admin_quizzes' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                Manage
              </button>
              <button
                id="mobile-nav-admin-scores"
                onClick={() => onChangeTab('admin_attempts')}
                className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  currentTab === 'admin_attempts' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Users className="w-4 h-4" />
                Directory
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
