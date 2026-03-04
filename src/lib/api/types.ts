// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Auth / User
export interface SubscriptionInfo {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  trial_end: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: SubscriptionInfo;
  created_at: string;
  last_login_at: string | null;
}

// Admin Stats
export interface AdminStats {
  user_count: number;
  active_subscription_count: number;
  test_set_count: number;
  question_count: number;
  attempt_count: number;
  speaking_attempt_count: number;
  saved_word_count: number;
  nihao_word_count: number;
  // Data quality
  questions_without_answer: number;
  questions_without_options: number;
  questions_without_audio: number;
  questions_with_explanation: number;
  listening_reading_count: number;
  listening_count: number;
}

// Speaking Attempts
export interface AdminSpeakingAttemptItem {
  id: string;
  user_id: string;
  user_email: string;
  test_set_id: string;
  test_set_name: string;
  question_id: string;
  mode: string;
  status: string;
  overall_score: number | null;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
}

// Vocabulary Admin
export interface VocabPoolStats {
  saved_word_count: number;
  saved_word_user_count: number;
  nihao_word_count: number;
  top_saved_words: Array<{ word: string; count: number }>;
}

export interface AdminSavedWordItem {
  id: string;
  user_id: string;
  user_email: string;
  word: string;
  source_type: string | null;
  test_set_name: string | null;
  created_at: string;
}

export interface AdminNihaoWordItem {
  id: string;
  word: string;
  display_form: string;
  level: string;
  lesson: number;
  lesson_title: string | null;
  theme: string | null;
  meaning_zh: string | null;
  meaning_en: string | null;
  part_of_speech: string | null;
}

// Admin User List Item
export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription_status: string | null;
  created_at: string;
  last_login_at: string | null;
}

// Admin Test Set
export interface TestSetQuality {
  total: number;
  with_answer: number;
  with_options: number;
  with_audio: number;
}

export interface AdminTestSetItem {
  id: string;
  code: string;
  name: string;
  type: string;
  question_count: number;
  is_free: boolean;
  is_deleted: boolean;
  order: number;
  quality?: TestSetQuality;
}

export interface AdminTestSetDetail {
  id: string;
  code: string;
  name: string;
  type: string;
  question_count: number;
  time_limit_minutes: number;
  is_free: boolean;
  is_deleted: boolean;
  order: number;
  serie_number: number | null;
  source_date: string | null;
  created_at: string;
  updated_at: string;
}

// Admin Question
export interface AdminQuestionItem {
  id: string;
  test_set_id: string;
  type: string;
  question_number: number;
  level: string | null;
  question_text: string | null;
  has_options: boolean;
  has_answer: boolean;
  is_deleted: boolean;
  has_explanation: boolean;
  has_audio: boolean;
}

export interface OptionInput {
  key: string;
  text: string;
}

export interface DistractorDetail {
  text: string | null;
  trap_type: string | null;
  analysis: string | null;
}

export interface SentenceTranslationDetail {
  fr: string | null;
  zh: string | null;
  is_key: boolean | null;
}

export interface VocabularyItemDetail {
  word: string | null;
  meaning: string | null;
  freq: string | null;
}

export interface ExplanationDetail {
  sentence_translation: SentenceTranslationDetail[] | null;
  correct_reasoning: string | null;
  distractors: Record<string, DistractorDetail> | null;
  exam_skill: string | null;
  trap_pattern: string | null;
  vocabulary: VocabularyItemDetail[] | null;
  similar_tip: string | null;
  status: string | null;
  generated_by: string | null;
}

// Admin Subscriptions
export interface AdminSubscriptionItem {
  user_id: string;
  email: string;
  name: string | null;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface SubscriptionRevenue {
  total_active: number;
  total_trialing: number;
  total_cancelled: number;
  total_past_due: number;
  by_plan: Record<string, number>;
  estimated_mrr: number;
}

export interface StripeEventItem {
  event_id: string;
  event_type: string;
  processed_at: string;
}

// Explanations
export interface ExplanationStats {
  total: number;
  with_explanation: number;
  without_explanation: number;
  by_type: Record<string, { total: number; with_explanation: number }>;
}

export interface BatchStatus {
  running: boolean;
  total: number;
  completed: number;
  failed: number;
  errors: Array<{ question_id: string; error: string }>;
}

// Attempts
export interface AdminAttemptItem {
  id: string;
  user_id: string;
  user_email: string;
  test_set_id: string;
  test_set_name: string;
  mode: string;
  status: string;
  score: number | null;
  total: number;
  answered_count: number;
  started_at: string;
  completed_at: string | null;
}

export interface AttemptAnswerItem {
  question_number: number;
  question_id: string;
  selected: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
}

export interface AdminAttemptDetail extends AdminAttemptItem {
  answers: AttemptAnswerItem[];
}

// Analytics
export interface AnalyticsOverview {
  daily_attempts: Array<{ date: string; count: number }>;
  dau: Array<{ date: string; dau: number }>;
  avg_score_by_type: Record<string, { avg_score: number; count: number }>;
  by_mode: Record<string, number>;
  new_users: Array<{ date: string; count: number }>;
}

export interface RetentionData {
  total_registered: number;
  d1: number;
  d7: number;
  d30: number;
  d1_rate: number;
  d7_rate: number;
  d30_rate: number;
}

export interface ConversionCohort {
  month: string;
  registered: number;
  activated: number;
  rate: number;
}

export interface ConversionData {
  total_registered: number;
  activated: number;
  conversion_rate: number;
  cohorts: ConversionCohort[];
}

export interface TrialConversionData {
  total_trialed: number;
  converted: number;
  churned: number;
  still_trialing: number;
  conversion_rate: number;
  churn_rate: number;
}

export interface ScoreDistBucket {
  range: string;
  listening: number;
  reading: number;
}

export interface AnalyticsInsights {
  retention: RetentionData;
  feature_usage: Record<string, number>;
  conversion: ConversionData;
  trial_conversion: TrialConversionData;
  score_distribution: ScoreDistBucket[];
}

export interface TestPopularityItem {
  test_set_id: string;
  test_set_name: string;
  test_set_type: string;
  attempt_count: number;
  completed_count: number;
  completion_rate: number;
  avg_score: number | null;
}

export interface DifficultyItem {
  question_id: string;
  question_number: number | null;
  question_text: string;
  type: string;
  level: string | null;
  total_answers: number;
  wrong_count: number;
  wrong_rate: number;
}

// Writing Submissions
export interface AdminWritingItem {
  id: string;
  user_id: string;
  user_email: string;
  question_id: string;
  test_set_id: string;
  task_number: number;
  word_count: number;
  total_score: number | null;
  estimated_level: string | null;
  created_at: string;
}

export interface CriterionFeedback {
  score: number;
  feedback: string;
  highlights: string[];
}

export interface AdminWritingDetail {
  id: string;
  user_id: string;
  user_email: string;
  question_id: string;
  test_set_id: string;
  task_number: number;
  essay_text: string;
  word_count: number;
  feedback: {
    total_score: number;
    estimated_nclc: string;
    estimated_level: string;
    overall_comment: string;
    adequation: CriterionFeedback | null;
    coherence: CriterionFeedback | null;
    vocabulaire: CriterionFeedback | null;
    grammaire: CriterionFeedback | null;
    corrections: Array<{ original: string; corrected: string; explanation: string }>;
    vocab_suggestions: Array<{ original: string; suggestion: string; reason: string }>;
  } | null;
  created_at: string;
}

// Data Operations
export interface ImportPreviewResult {
  test_set_id: string;
  test_set_name: string;
  to_create: number;
  to_update: number;
  conflicts: number;
  details: {
    create_numbers: number[];
    update_numbers: number[];
    conflict_details: Array<{ question: Record<string, unknown>; reason: string }>;
  };
}

export interface ImportResult {
  message: string;
  created: number;
  updated: number;
  errors: Array<{ question_number?: number; error: string }>;
}

export interface AudioStatus {
  total_listening: number;
  with_audio: number;
  without_audio: number;
  by_test_set: Array<{
    test_set_id: string;
    test_set_name: string;
    total: number;
    with_audio: number;
  }>;
}

export interface MissingAudioItem {
  question_id: string;
  test_set_id: string;
  test_set_name: string;
  question_number: number | null;
}

// User Feedback
export interface FeedbackItem {
  id: string;
  user_email: string;
  category: string;
  content: string;
  page_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

// Audit Logs
export interface AuditLogItem {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AudioTimestamp {
  text: string;
  start: number;
  end: number;
  sentence_index: number | null;
}

export interface AdminQuestionDetail {
  id: string;
  test_set_id: string;
  type: string;
  question_number: number;
  level: string | null;
  question_text: string | null;
  passage: string | null;
  transcript: string | null;
  audio_url: string | null;
  correct_answer: string | null;
  options: OptionInput[];
  is_deleted: boolean;
  has_explanation: boolean;
  explanation: ExplanationDetail | null;
  audio_timestamps: AudioTimestamp[] | null;
  created_at: string;
  updated_at: string;
}
