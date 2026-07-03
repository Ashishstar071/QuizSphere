import { Calendar, Award, CheckCircle2, XCircle, Percent, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { QuizAttempt } from '../types';

interface MyAttemptsProps {
  attempts: QuizAttempt[];
  onReviewAttempt: (attemptId: string) => void;
}

export default function MyAttempts({ attempts, onReviewAttempt }: MyAttemptsProps) {
  // Stats
  const totalSubmissions = attempts.length;
  const totalPointsEarned = attempts.reduce((sum, a) => sum + a.score, 0);
  const averageAccuracy = totalSubmissions > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / totalSubmissions)
    : 0;
  const passedCount = attempts.filter(a => a.percent >= 50).length;

  return (
    <div id="my-attempts-container" className="space-y-6 animate-fade-in">
      
      {/* Bento Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Your Academic Scores</h2>
        <p className="text-sm text-slate-500 mt-1">Review completed modules, trace performance growth, and study score logs.</p>
      </div>

      {totalSubmissions > 0 && (
        /* Aggregate Stats Row styled as clean Bento Tiles */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Submissions</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{totalSubmissions}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Award className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Points</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{totalPointsEarned.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Percent className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Average Accuracy</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{averageAccuracy}%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Success Rate</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">
                {totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {attempts.length === 0 ? (
        <div id="no-attempts-yet" className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="w-12 h-12 bg-slate-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-700">No quizzes completed yet</h3>
          <p className="text-sm text-slate-400 mt-1">Select any quiz from the Catalogue to submit your answers and view your grades instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attempts.map((attempt) => {
            const isPass = attempt.percent >= 50;
            return (
              <div
                key={attempt.id}
                id={`my-attempt-card-${attempt.id}`}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all duration-300"
              >
                <div className="p-6 space-y-4">
                  {/* Category and Date */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] uppercase tracking-wide font-bold">
                      {attempt.category || 'General'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{attempt.quizTitle}</h3>

                  {/* Score details */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Points Earned</span>
                      <span className="text-base font-extrabold text-slate-700 mt-1 block">
                        {attempt.score} <span className="text-xs text-slate-400 font-medium">/ {attempt.totalPoints}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Success Percentage</span>
                      <span className={`text-base font-black mt-1 block ${isPass ? 'text-emerald-600' : 'text-red-500'}`}>
                        {attempt.percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status & review */}
                <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isPass ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-700 uppercase tracking-wide text-[10px]">Passed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-red-700 uppercase tracking-wide text-[10px]">Needs Practice</span>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 italic font-medium">Score logged automatically</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
