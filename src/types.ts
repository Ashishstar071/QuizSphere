export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // for multiple_choice, e.g. ["Paris", "London", "Berlin", "Rome"]
  correctAnswer: string; // for MC, the string text or option index (we will use string match or option index)
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number; // in minutes. 0 means no limit.
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  quizId: string;
  quizTitle: string;
  category: string;
  answers: Record<string, string>; // questionId -> submitted answer string
  score: number; // points earned
  totalPoints: number; // total points possible
  percent: number; // score / totalPoints * 100
  completedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
