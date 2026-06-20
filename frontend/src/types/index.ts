export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  country: string;
  region: "LOCAL" | "INTERNATIONAL";
  subscription: "FREE" | "PAID";
  status: "ACTIVE" | "SUSPENDED";
}

export interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  roleRequired: "LOCAL_FREE" | "LOCAL_PAID" | "INTL_FREE" | "INTL_PAID";
  highlight?: boolean;
}

export interface QuestionCategory {
  _id: string;
  name: string;
  section: "READING_WRITING" | "MATH";
  description: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  _id: string;
  text: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  category: QuestionCategory | string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  section: "READING_WRITING" | "MATH";
  tags: string[];
  source: "MANUAL" | "AI_EXTRACTED";
  status: "DRAFT" | "REVIEW" | "PUBLISHED";
  createdBy: string;
  createdAt: string;
}

export interface DiagnosticTest {
  _id: string;
  title: string;
  description: string;
  section: "READING_WRITING" | "MATH" | "FULL";
  questions: Question[] | string[];
  timeLimit: number;
  totalMarks: number;
  isActive: boolean;
  accessLevel: "FREE" | "PAID";
  questionCount?: number;
  attemptCount?: number;
  createdAt: string;
}

export interface AttemptAnswer {
  question: Question | string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number;
}

export interface TestAttempt {
  _id: string;
  student: string;
  test: DiagnosticTest | string;
  answers: AttemptAnswer[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  timeTaken: number;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface PracticeSession {
  _id: string;
  student: string;
  question: Question | string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export interface ExtractedQuestion {
  text: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: string;
  confidence: number;
  approved: boolean;
}

export interface PracticeTestUpload {
  _id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: { name: string; email: string } | string;
  status: "UPLOADED" | "PROCESSING" | "EXTRACTED" | "REVIEWED" | "PUBLISHED" | "FAILED";
  extractedQuestions: ExtractedQuestion[];
  reviewNotes: string;
  reviewedBy: { name: string; email: string } | string | null;
  errorMessage: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PredictedScore {
  score: number;
  confidence: number;
  basedOn: number;
  range: { low: number; high: number };
}

export interface DashboardStats {
  totalTests: number;
  practiceCount: number;
  avgScore: number;
  bestScore: number;
}

export interface PerformanceDataPoint {
  index: number;
  testTitle: string;
  section: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  date: string;
}

export interface CategoryBreakdown {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface AdminOverview {
  totalUsers: number;
  paidUsers: number;
  totalQuestions: number;
  publishedQuestions: number;
  totalTests: number;
  activeTests: number;
  totalAttempts: number;
  pendingUploads: number;
  pendingInquiries: number;
  totalStories: number;
}
