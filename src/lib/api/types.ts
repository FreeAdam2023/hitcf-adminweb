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
  answer_count: number;
  speaking_attempt_count: number;
  saved_word_count: number;
  nihao_word_count: number;
  word_lookup_count: number;
  vocabulary_card_count: number;
  // Data quality
  questions_without_answer: number;
  questions_without_options: number;
  questions_without_audio: number;
  questions_with_explanation: number;
  listening_reading_count: number;
  listening_count: number;
}

// Traffic (Cloudflare Analytics)
export interface TrafficDay {
  date: string;
  requests: number;
  page_views: number;
  unique_visitors: number;
  bytes: number;
}

export interface TrafficData {
  days: TrafficDay[];
  today: TrafficDay | null;
  error?: string;
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

export interface WordViewStats {
  days: number;
  total_views: number;
  unique_users: number;
  by_source_type: Record<string, number>;
  by_pool: Record<string, number>;
  top_viewed_words: Array<{ word: string; count: number }>;
  daily_trend: Array<{ date: string; count: number }>;
}

export interface AnnouncementItem {
  id: string;
  title: Record<string, string>;
  content: Record<string, string>;
  type: string;
  published_at: string;
  created_by: string | null;
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

// User Tracking
export interface UserTrackingInfo {
  signup_ip: string | null;
  signup_country: string | null;
  signup_city: string | null;
  signup_region: string | null;
  signup_user_agent: string | null;
  signup_referer: string | null;
  signup_utm_source: string | null;
  signup_utm_medium: string | null;
  signup_utm_campaign: string | null;
  last_login_ip: string | null;
  last_login_user_agent: string | null;
}

// Admin User List Item
export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_locked: boolean;
  subscription_status: string | null;
  created_at: string;
  last_login_at: string | null;
  activity: {
    answers: number;
    saved_words: number;
    wrong_answers: number;
  } | null;
  tracking: UserTrackingInfo | null;
}

export interface UserDetailActivity {
  answers: number;
  writing: number;
  speaking: number;
  conversations: number;
  vocab: number;
  wrong_answers: number;
  reports: number;
  active_days: number;
}

export interface UserDetailAttempt {
  id: string;
  test_set_name: string;
  test_set_type: string;
  mode: string;
  status: string;
  score: number | null;
  total: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_locked: boolean;
  locked_at: string | null;
  locked_reason: string | null;
  created_at: string;
  last_login_at: string | null;
  subscription: {
    plan: string;
    status: string;
    trial_end: string | null;
    current_period_end: string | null;
    stripe_customer_id: string | null;
  } | null;
  tracking: UserTrackingInfo | null;
  activity: UserDetailActivity;
  recent_attempts: UserDetailAttempt[];
}

export interface NotificationItem {
  type: string;
  message: string;
  user_id: string;
  email: string;
  time: string;
}

export interface QuestionReportItem {
  id: string;
  user_id: string;
  user_email: string;
  question_id: string;
  question_number: number | null;
  question_type: string;
  question_text: string;
  issue_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface CostItem {
  name: string;
  type: string;
  plan?: string;
  usage?: string;
  cost: number;
  unit: string;
  note: string;
}

export interface CostEstimate {
  period: string;
  fixed_costs: CostItem[];
  variable_costs: CostItem[];
  summary: {
    total_fixed: number;
    total_variable: number;
    total_estimated: number;
    user_count: number;
    cost_per_user: number;
  };
}

export interface GeoCountry {
  country: string;
  count: number;
  users: Array<{ city: string; email: string }>;
}

export interface UserGeoData {
  countries: GeoCountry[];
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
  exam_type?: string;
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
  exam_type?: string;
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
  user_growth: Array<{ date: string; total: number }>;
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

// User Activity
export interface ActivityEvent {
  user_id: string;
  action: string;
  desc: string;
  time: string;
}

export interface UserActivitySummary {
  user_id: string;
  email: string;
  name: string;
  created_at: string | null;
  last_active: string | null;
  attempts: number;
  writing: number;
  speaking: number;
  conversations: number;
  vocab: number;
  total_actions: number;
}

export interface UserActivityData {
  heatmap: number[][]; // 7×24 matrix [dow][hour]
  feed: ActivityEvent[];
  users: UserActivitySummary[];
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
  screenshot: string | null;
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

// Referrals
export interface AdminReferralItem {
  id: string;
  referrer_email: string;
  referrer_name: string | null;
  referee_email: string;
  referee_name: string | null;
  referral_code: string;
  status: string;
  referrer_reward_days: number;
  referee_reward_days: number;
  referrer_rewarded: boolean;
  referee_rewarded: boolean;
  fraud_flags: string[];
  created_at: string;
}

export interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  fraud: number;
  total_referrer_reward_days: number;
  total_referee_reward_days: number;
  top_referrers: { email: string; name: string | null; count: number }[];
}

// Competitors
export interface CompetitorFeature {
  name: string;
  value: string;
  score: number;
}

export interface MonitorSnapshot {
  checked_at: string;
  status_code: number;
  is_up: boolean;
  changes_detected: boolean;
  notes: string;
}

export interface CompetitorItem {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
  description: string | null;
  tags: string[];
  status: string;
  pricing_free: string | null;
  pricing_paid: string | null;
  features: CompetitorFeature[];
  notes: string | null;
  strengths: string | null;
  weaknesses: string | null;
  monitor_enabled: boolean;
  last_check: MonitorSnapshot | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitorDetail extends CompetitorItem {
  check_history: MonitorSnapshot[];
}

export interface ComparisonColumn {
  id: string;
  name: string;
  is_self: boolean;
}

export interface ComparisonCell {
  value: string;
  score: number;
}

export interface ComparisonRow {
  feature: string;
  [columnId: string]: string | ComparisonCell;
}

export interface ComparisonMatrix {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}

// ── Funnel & Advanced Analytics ──────────────────────────────

export interface FunnelStep {
  name: string;
  label: string;
  count: number;
  rate: number;
}

export interface FunnelData {
  days: number;
  steps: FunnelStep[];
}

export interface SegmentRow {
  segment: string;
  registered: number;
  paid: number;
  conversion_rate: number;
}

export interface SegmentsData {
  days: number;
  by_utm_source: SegmentRow[];
  by_country: SegmentRow[];
  by_device: SegmentRow[];
}

export interface FeatureCorrelationGroup {
  group: string;
  users: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  conversation: number;
  vocabulary: number;
}

export interface FeatureCorrelationData {
  days: number;
  groups: FeatureCorrelationGroup[];
}

export interface ChurnRiskUser {
  user_id: string;
  email: string;
  name: string | null;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  last_active: string;
  days_inactive: number;
}

export interface ChurnRiskData {
  inactive_days: number;
  total_subscribers: number;
  at_risk_count: number;
  at_risk: ChurnRiskUser[];
}

export interface CohortRetentionPeriod {
  period: number;
  active: number;
  rate: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  retention: CohortRetentionPeriod[];
}

export interface CohortRetentionData {
  granularity: string;
  cohorts: CohortRow[];
  periods: string[];
}

export interface FeatureAdoptionData {
  days: number;
  total_users: number;
  users_with_activity: number;
  first_feature: Record<string, number>;
  top_sequences: Array<{ sequence: string[]; count: number }>;
}

export interface LTVPlanStats {
  active: number;
  churned: number;
  avg_tenure_days: number;
  churn_rate: number;
  monthly_price: number;
}

export interface LTVData {
  total_subscribers_ever: number;
  active_subscribers: number;
  avg_tenure_days: number;
  by_plan: Record<string, LTVPlanStats>;
  estimated_monthly_arpu: number;
  estimated_ltv: number;
}

export interface UserEventItem {
  id: string;
  user_id: string;
  user_email: string;
  event: string;
  data: Record<string, unknown>;
  source: string;
  created_at: string;
}

export interface EventSummary {
  event: string;
  count: number;
}

export interface EventsData {
  total: number;
  page: number;
  page_size: number;
  items: UserEventItem[];
  event_summary: EventSummary[];
}

// Watermark Lookup
export interface WatermarkUserResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_locked: boolean;
  locked_at: string | null;
  locked_reason: string | null;
  subscription_status: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

// ---- 运营工作台 (Ops Workbench) ----

export interface OpsPostPerformance {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  signups_attributed: number;
  last_updated: string;
}

export interface OpsContentDraft {
  id: string;
  admin_id: string;
  platform: string;
  topic: string;
  angle: string | null;
  tone: string;
  title: string;
  body: string;
  hashtags: string[];
  variation_group: string | null;
  variation_index: number;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  banned_words_found: string[];
  performance: OpsPostPerformance | null;
  created_at: string;
  updated_at: string;
}

export interface OpsReplyVariation {
  text: string;
  use_count: number;
  last_used_at: string | null;
  is_ai_generated: boolean;
}

export interface OpsReplyScenario {
  id: string;
  name: string;
  description: string;
  platform: string;
  replies: OpsReplyVariation[];
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface OpsAssetItem {
  id: string;
  admin_id: string;
  filename: string;
  blob_url: string;
  content_type: string;
  size_bytes: number;
  tags: string[];
  description: string | null;
  is_reusable: boolean;
  created_at: string;
}

export interface OpsPerformanceSummary {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_saves: number;
  total_signups: number;
  avg_engagement_rate: number;
  best_post: OpsContentDraft | null;
}

export interface OpsCalendarEntry {
  id: string;
  title: string;
  topic: string;
  status: string;
  date: string;
  platform: string;
}

export interface OpsCalendarData {
  year: number;
  month: number;
  entries: OpsCalendarEntry[];
}

export interface OpsGenerateResult {
  variation_group: string;
  drafts: OpsContentDraft[];
}
