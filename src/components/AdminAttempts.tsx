import { useState, useEffect } from 'react';
import { Search, Award, Percent, ClipboardCheck, TrendingUp, Calendar, Users } from 'lucide-react';
import { QuizAttempt } from '../types';

interface AdminAttemptsProps {
  token: string;
}

export default function AdminAttempts({ token }: AdminAttemptsProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAllAttempts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/attempts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch global attempts.');
      }
      setAttempts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAttempts();
  }, [token]);

  // Filtering
  const filteredAttempts = attempts.filter((att) => {
    return (
      att.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      att.username.toLowerCase().includes(search.toLowerCase()) ||
      att.quizTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Calculate Aggregations
  const totalAttemptsCount = attempts.length;
  const averageScore = totalAttemptsCount > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / totalAttemptsCount)
    : 0;
  const passRate = totalAttemptsCount > 0
    ? Math.round((attempts.filter((a) => a.percent >= 50).length / totalAttemptsCount) * 100)
    : 0;
  const maxScore = totalAttemptsCount > 0
    ? Math.max(...attempts.map((a) => a.percent))
    : 0;

  return (
    <div id="admin-attempts-container" className="space-y-6 animate-fade-in">
      
      {/* Intro Header Styled with Bento Rounded-3xl */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Student Attempts Directory</h2>
          <p className="text-sm text-slate-500 mt-1">Review student scoring logs, track aggregate performance, and monitor pass rates.</p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="attempts-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, username, quiz..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Aggregate Stats Cards Row styled as premium Bento cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Total Submissions</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{totalAttemptsCount}</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Percent className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Average Grade</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{averageScore}%</span>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Pass Rate (≥50%)</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{passRate}%</span>
          </div>
        </div>

        {/* Maximum Recorded */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Award className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Highest Score</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{maxScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Attempts List Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading attempts logs...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 font-semibold">
            Failed to load attempts directory: {error}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No attempts logged yet</h3>
            <p className="text-xs text-slate-400 mt-1">Once users complete quizzes, their scores and response sheets will compile here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Quiz Title</th>
                  <th className="p-4">Points Scored</th>
                  <th className="p-4">Percent</th>
                  <th className="p-4">Result</th>
                  <th className="p-4 text-right pr-6">Completed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-800">{att.username}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{att.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{att.quizTitle}</div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md text-[9px] uppercase mt-1 inline-block">
                        {att.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-semibold text-slate-600">
                      {att.score} / {att.totalPoints}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {att.percent}%
                    </td>
                    <td className="p-4">
                      {att.percent >= 50 ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[9px] uppercase">
                          Passed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg text-[9px] uppercase">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6 text-xs text-slate-400 font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(att.completedAt).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
