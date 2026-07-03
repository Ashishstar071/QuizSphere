import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { User, Quiz, QuizAttempt, Question } from './src/types.js';

const __filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');

// Helper to load JSON files
function loadData<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

// Helper to save JSON files
function saveData<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Initial Default Quizzes
const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'quiz-web-dev',
    title: 'Web Development Essentials',
    description: 'Test your knowledge on HTML, CSS, JavaScript, and React basics.',
    category: 'Technology',
    timeLimit: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-web-1',
        type: 'multiple_choice',
        text: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Hyper Transfer Markup Language',
          'Home Tool Markup Language'
        ],
        correctAnswer: 'Hyper Text Markup Language',
        points: 10
      },
      {
        id: 'q-web-2',
        type: 'true_false',
        text: 'In React, state updates via the useState setter function are asynchronous.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 5
      },
      {
        id: 'q-web-3',
        type: 'multiple_choice',
        text: 'Which hook is used to perform side effects in a React functional component?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 'useEffect',
        points: 10
      },
      {
        id: 'q-web-4',
        type: 'short_answer',
        text: 'What CSS property is used to change the text color of an HTML element?',
        correctAnswer: 'color',
        points: 10
      },
      {
        id: 'q-web-5',
        type: 'short_answer',
        text: 'What is the standard port number for HTTPS traffic?',
        correctAnswer: '443',
        points: 10
      }
    ]
  },
  {
    id: 'quiz-space',
    title: 'Cosmic Mysteries',
    description: 'Embark on a journey through space, stars, planets, and cosmic wonders.',
    category: 'Science',
    timeLimit: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-space-1',
        type: 'multiple_choice',
        text: 'Which planet is known as the "Red Planet"?',
        options: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
        correctAnswer: 'Mars',
        points: 10
      },
      {
        id: 'q-space-2',
        type: 'true_false',
        text: 'The Milky Way is a spiral galaxy.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 5
      },
      {
        id: 'q-space-3',
        type: 'multiple_choice',
        text: 'What is the approximate age of the universe in billions of years?',
        options: ['4.5 Billion', '13.8 Billion', '9.3 Billion', '20.1 Billion'],
        correctAnswer: '13.8 Billion',
        points: 10
      },
      {
        id: 'q-space-4',
        type: 'short_answer',
        text: 'What force keeps planets in orbit around the Sun?',
        correctAnswer: 'gravity',
        points: 10
      }
    ]
  }
];

// Helper to pre-populate default admin user and default quizzes
function seedDatabase() {
  const users = loadData<{ id: string; username: string; email: string; passwordHash: string; role: 'admin' | 'user'; token?: string; createdAt: string }[]>(USERS_FILE, []);
  
  // Seed admin user if none exists
  const hasAdmin = users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    users.push({
      id: 'admin-default',
      username: 'QuizMaster Admin',
      email: 'admin@quizsystem.com',
      passwordHash: 'admin123', // plain for simple self-contained setup
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    saveData(USERS_FILE, users);
    console.log('Seeded default administrator account: admin@quizsystem.com / admin123');
  }

  // Seed quizzes if none exists
  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  if (quizzes.length === 0) {
    saveData(QUIZZES_FILE, DEFAULT_QUIZZES);
    console.log('Seeded default quizzes.');
  }
}

seedDatabase();

// Authentication Middleware
interface ExtendedRequest extends express.Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
  };
}

const authMiddleware = (req: ExtendedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const users = loadData<{ id: string; username: string; email: string; role: 'admin' | 'user'; token?: string }[]>(USERS_FILE, []);
  const foundUser = users.find(u => u.token === token);

  if (!foundUser) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = {
    id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    role: foundUser.role
  };
  next();
};

const adminMiddleware = (req: ExtendedRequest, res: express.Response, next: express.NextFunction) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      return;
    }
    next();
  });
};

// ================= AUTHENTICATION APIS =================

// Register User
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields (username, email, password) are required.' });
    return;
  }

  const users = loadData<any[]>(USERS_FILE, []);
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }

  const token = `token_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  const newUser = {
    id: `usr_${Math.random().toString(36).substring(2, 9)}`,
    username,
    email: email.toLowerCase(),
    passwordHash: password, // Store password (simple hashing or raw for this self-contained system)
    role: 'user' as const,
    token,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveData(USERS_FILE, users);

  res.status(201).json({
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    },
    token
  });
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const users = loadData<any[]>(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = `token_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  user.token = token;
  saveData(USERS_FILE, users);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  });
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req: ExtendedRequest, res) => {
  res.json({ user: req.user });
});


// ================= QUIZ & QUIZ ATTEMPT APIS =================

// Helper to strip correct answers from questions for normal users
function stripAnswers(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map(q => {
      const { correctAnswer, ...rest } = q;
      return rest as Question; // Strip correctAnswer field
    })
  };
}

// Get All Quizzes
app.get('/api/quizzes', authMiddleware, (req: ExtendedRequest, res) => {
  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  
  // If administrator, return everything. Otherwise strip out the correctAnswer field.
  if (req.user?.role === 'admin') {
    res.json(quizzes);
  } else {
    res.json(quizzes.map(stripAnswers));
  }
});

// Get Quiz by ID
app.get('/api/quizzes/:id', authMiddleware, (req: ExtendedRequest, res) => {
  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  const quiz = quizzes.find(q => q.id === req.params.id);

  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  if (req.user?.role === 'admin') {
    res.json(quiz);
  } else {
    res.json(stripAnswers(quiz));
  }
});

// Submit Quiz Attempt (Scores instantly on the server)
app.post('/api/quizzes/:id/submit', authMiddleware, (req: ExtendedRequest, res) => {
  const { answers } = req.body as { answers: Record<string, string> };
  const quizId = req.params.id;

  if (!answers) {
    res.status(400).json({ error: 'Answers payload is required.' });
    return;
  }

  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  const quiz = quizzes.find(q => q.id === quizId);

  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  let earnedScore = 0;
  let totalPoints = 0;
  const gradedQuestionsResult = quiz.questions.map(q => {
    const userAnswer = (answers[q.id] || '').trim().toLowerCase();
    const correctAnswer = q.correctAnswer.trim().toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    totalPoints += q.points;
    if (isCorrect) {
      earnedScore += q.points;
    }

    return {
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      userAnswer: answers[q.id] || '',
      correctAnswer: q.correctAnswer,
      isCorrect,
      points: q.points
    };
  });

  const percent = totalPoints > 0 ? Math.round((earnedScore / totalPoints) * 100) : 0;

  const attempt: QuizAttempt = {
    id: `att_${Math.random().toString(36).substring(2, 9)}`,
    userId: req.user!.id,
    userEmail: req.user!.email,
    username: req.user!.username,
    quizId: quiz.id,
    quizTitle: quiz.title,
    category: quiz.category,
    answers,
    score: earnedScore,
    totalPoints,
    percent,
    completedAt: new Date().toISOString()
  };

  const attempts = loadData<QuizAttempt[]>(ATTEMPTS_FILE, []);
  attempts.push(attempt);
  saveData(ATTEMPTS_FILE, attempts);

  res.json({
    attemptId: attempt.id,
    score: earnedScore,
    totalPoints,
    percent,
    gradedQuestions: gradedQuestionsResult,
    completedAt: attempt.completedAt
  });
});

// Get My Attempts
app.get('/api/attempts/my', authMiddleware, (req: ExtendedRequest, res) => {
  const attempts = loadData<QuizAttempt[]>(ATTEMPTS_FILE, []);
  const userAttempts = attempts.filter(att => att.userId === req.user!.id);
  res.json(userAttempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
});


// ================= ADMINISTRATOR APIS =================

// Admin: Get All Attempts across the entire system
app.get('/api/admin/attempts', adminMiddleware, (req, res) => {
  const attempts = loadData<QuizAttempt[]>(ATTEMPTS_FILE, []);
  res.json(attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
});

// Admin: Get All Registered Users
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const users = loadData<any[]>(USERS_FILE, []);
  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  })));
});

// Admin: Create Quiz
app.post('/api/admin/quizzes', adminMiddleware, (req, res) => {
  const { title, description, category, timeLimit, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'Quiz title and an array of questions are required.' });
    return;
  }

  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  
  const newQuiz: Quiz = {
    id: `quiz_${Math.random().toString(36).substring(2, 9)}`,
    title,
    description: description || '',
    category: category || 'General',
    timeLimit: Number(timeLimit) || 0,
    questions: questions.map((q: any) => ({
      id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
      text: q.text,
      type: q.type || 'multiple_choice',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      points: Number(q.points) || 10
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  quizzes.push(newQuiz);
  saveData(QUIZZES_FILE, quizzes);

  res.status(201).json(newQuiz);
});

// Admin: Update Quiz
app.put('/api/admin/quizzes/:id', adminMiddleware, (req, res) => {
  const { title, description, category, timeLimit, questions } = req.body;
  const quizId = req.params.id;

  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  const quizIndex = quizzes.findIndex(q => q.id === quizId);

  if (quizIndex === -1) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'Quiz title and an array of questions are required.' });
    return;
  }

  const updatedQuiz: Quiz = {
    ...quizzes[quizIndex],
    title,
    description: description || '',
    category: category || 'General',
    timeLimit: Number(timeLimit) || 0,
    questions: questions.map((q: any) => ({
      id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
      text: q.text,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      points: Number(q.points) || 10
    })),
    updatedAt: new Date().toISOString()
  };

  quizzes[quizIndex] = updatedQuiz;
  saveData(QUIZZES_FILE, quizzes);

  res.json(updatedQuiz);
});

// Admin: Delete Quiz
app.delete('/api/admin/quizzes/:id', adminMiddleware, (req, res) => {
  const quizId = req.params.id;
  const quizzes = loadData<Quiz[]>(QUIZZES_FILE, []);
  const filtered = quizzes.filter(q => q.id !== quizId);

  if (quizzes.length === filtered.length) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  saveData(QUIZZES_FILE, filtered);
  res.json({ message: 'Quiz deleted successfully.' });
});


// ================= VITE / SPA FALLBACK =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
