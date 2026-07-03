import React, { useState } from 'react';
import { Plus, Trash, Edit3, Save, Undo, Check, ClipboardList, Timer, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { Quiz, Question, QuestionType } from '../types';

interface AdminQuizzesProps {
  quizzes: Quiz[];
  token: string;
  onRefresh: () => void;
}

export default function AdminQuizzes({ quizzes, token, onRefresh }: AdminQuizzesProps) {
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Editor form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const startCreate = () => {
    setTitle('');
    setDescription('');
    setCategory('General');
    setTimeLimit(5);
    setQuestions([
      {
        id: `q_new_1`,
        text: 'What is the capital of France?',
        type: 'multiple_choice',
        options: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        points: 10
      }
    ]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCreating(true);
    setEditingQuiz(null);
  };

  const startEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description);
    setCategory(quiz.category);
    setTimeLimit(quiz.timeLimit);
    setQuestions(JSON.parse(JSON.stringify(quiz.questions))); // Deep clone questions
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingQuiz(null);
    setIsCreating(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Question Management Helpers
  const addQuestion = () => {
    const newId = `q_new_${Math.random().toString(36).substring(2, 9)}`;
    const newQ: Question = {
      id: newId,
      text: '',
      type: 'multiple_choice',
      options: ['Option A', 'Option B'],
      correctAnswer: 'Option A',
      points: 10
    };
    setQuestions([...questions, newQ]);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestionField = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    
    if (field === 'type') {
      const type = value as QuestionType;
      updated[index].type = type;
      if (type === 'true_false') {
        updated[index].options = ['True', 'False'];
        updated[index].correctAnswer = 'True';
      } else if (type === 'short_answer') {
        delete updated[index].options;
        updated[index].correctAnswer = '';
      } else {
        updated[index].options = ['Option A', 'Option B', 'Option C', 'Option D'];
        updated[index].correctAnswer = 'Option A';
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    
    setQuestions(updated);
  };

  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      updated[qIdx].options = [...(updated[qIdx].options || []), `New Option`];
      setQuestions(updated);
    }
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      const opts = [...(updated[qIdx].options || [])];
      
      // If the old value was selected as correct, update correct answer too
      const oldVal = opts[optIdx];
      opts[optIdx] = val;
      
      if (updated[qIdx].correctAnswer === oldVal) {
        updated[qIdx].correctAnswer = val;
      }
      
      updated[qIdx].options = opts;
      setQuestions(updated);
    }
  };

  const handleDeleteOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      const opts = (updated[qIdx].options || []).filter((_, idx) => idx !== optIdx);
      updated[qIdx].options = opts;
      
      // Fallback correct answer
      if (opts.length > 0 && !opts.includes(updated[qIdx].correctAnswer)) {
        updated[qIdx].correctAnswer = opts[0];
      }
      
      setQuestions(updated);
    }
  };

  // Save Quiz API call
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!title.trim()) {
      setErrorMsg('Quiz title is required.');
      return;
    }
    if (questions.length === 0) {
      setErrorMsg('You must include at least one question in the quiz.');
      return;
    }

    // Question validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setErrorMsg(`Question ${i + 1} cannot have blank question text.`);
        return;
      }
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        setErrorMsg(`Question ${i + 1} (Multiple Choice) must have at least 2 options.`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        setErrorMsg(`Question ${i + 1} must declare a correct answer key.`);
        return;
      }
    }

    setSaving(true);
    const isEdit = !!editingQuiz;
    const url = isEdit ? `/api/admin/quizzes/${editingQuiz!.id}` : '/api/admin/quizzes';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          timeLimit,
          questions
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save quiz.');
      }

      setSuccessMsg(`Quiz "${data.title}" saved successfully!`);
      onRefresh();
      
      // Exit editor mode after slight delay
      setTimeout(() => {
        setEditingQuiz(null);
        setIsCreating(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you absolutely sure you want to delete the quiz "${quizTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz.');
      }

      setSuccessMsg('Quiz deleted successfully.');
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Error deleting quiz: ${err.message}`);
    }
  };

  return (
    <div id="admin-quizzes-wrapper" className="space-y-6">
      
      {/* HEADER BAR */}
      {!editingQuiz && !isCreating && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quiz Management Suite</h2>
            <p className="text-sm text-slate-500 mt-1">Design quizzes, add multiple choice or short answer challenges, and edit questions.</p>
          </div>
          <button
            id="btn-create-quiz"
            onClick={startCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Quiz
          </button>
        </div>
      )}

      {/* FEEDBACK LABELS */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VIEW 1: QUIZZES MANAGEMENT INDEX TABLE */}
      {!editingQuiz && !isCreating && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {quizzes.length === 0 ? (
            <div className="text-center py-16 p-6">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700">No Quizzes Exist</h3>
              <p className="text-xs text-slate-400 mt-1">Click the "Create New Quiz" button to establish your first set of questions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-4 pl-6">Quiz Details</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Points</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {quizzes.map((quiz) => {
                    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
                    return (
                      <tr key={quiz.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-800">{quiz.title}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{quiz.description || 'No description.'}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px] tracking-wide uppercase">
                            {quiz.category || 'General'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Timer className="w-3.5 h-3.5" />
                            {quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'No limit'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Award className="w-3.5 h-3.5" />
                            {totalPoints} Points ({quiz.questions.length} Q)
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              id={`btn-edit-${quiz.id}`}
                              onClick={() => startEdit(quiz)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit questions and details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-${quiz.id}`}
                              onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Quiz"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUIZ CREATION & EDITING FORM */}
      {(editingQuiz || isCreating) && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header Row */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <Undo className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {isCreating ? 'Design New Quiz' : `Edit: ${editingQuiz?.title}`}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Define metadata, configure time thresholds, and structure questions.</p>
              </div>
            </div>

            <button
              id="btn-save-quiz-form"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>

          {/* Form Content Layout (Split metadata / Questions) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Quiz Metadata */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Quiz Settings</h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Quiz Title *
                </label>
                <input
                  id="input-quiz-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Closures"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Category / Subject
                </label>
                <input
                  id="input-quiz-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Programming, History, Physics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Time Limit (Minutes)
                </label>
                <div className="relative">
                  <input
                    id="input-quiz-timelimit"
                    type="number"
                    min="0"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold uppercase">Mins</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Use '0' for unlimited quiz time.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Quiz Description
                </label>
                <textarea
                  id="input-quiz-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what concepts are assessed in this quiz."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Panel: Dynamic Questions Builder */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">Question Sheets ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      id={`question-form-${q.id}`}
                      className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/80 relative space-y-4"
                    >
                      {/* Floating Trash */}
                      <button
                        type="button"
                        onClick={() => deleteQuestion(qIdx)}
                        className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                      {/* Question Index Badge */}
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Configure Question</span>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Question Prompt / Text *
                        </label>
                        <input
                          id={`input-q-text-${q.id}`}
                          type="text"
                          required
                          value={q.text}
                          onChange={(e) => updateQuestionField(qIdx, 'text', e.target.value)}
                          placeholder="e.g. Which of the following is a non-volatile memory type?"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      {/* Row: Type and Points */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Question Format
                          </label>
                          <select
                            id={`select-q-type-${q.id}`}
                            value={q.type}
                            onChange={(e) => updateQuestionField(qIdx, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
                          >
                            <option value="multiple_choice">Multiple Choice (MC)</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer (Text Match)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Award Points
                          </label>
                          <input
                            id={`input-q-points-${q.id}`}
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={(e) => updateQuestionField(qIdx, 'points', Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
                          />
                        </div>
                      </div>

                      {/* Options List (For MC only) */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              Answer Options
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                            >
                              + Add Option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex gap-2 items-center">
                                <input
                                  id={`input-option-${q.id}-${optIdx}`}
                                  type="text"
                                  value={opt}
                                  required
                                  onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOption(qIdx, optIdx)}
                                  disabled={q.options!.length <= 2}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-30 cursor-pointer"
                                  title="Delete Option"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer Selector */}
                      <div className="pt-2 border-t border-slate-100/80">
                        <label className="block text-[9px] font-bold text-indigo-500 uppercase tracking-wide mb-1">
                          Declare Correct Answer Key *
                        </label>

                        {q.type === 'multiple_choice' && q.options && (
                          <select
                            id={`select-correct-ans-${q.id}`}
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestionField(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                          >
                            {q.options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {q.type === 'true_false' && (
                          <select
                            id={`select-correct-ans-${q.id}`}
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestionField(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                          >
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        )}

                        {q.type === 'short_answer' && (
                          <input
                            id={`input-correct-ans-${q.id}`}
                            type="text"
                            required
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestionField(qIdx, 'correctAnswer', e.target.value)}
                            placeholder="e.g. 443"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        )}
                      </div>

                    </div>
                  ))}
                </div>

                {/* Bottom Add Question Trigger */}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full mt-4 py-3.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Click to Append Question Card
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

    </div>
  );
}
