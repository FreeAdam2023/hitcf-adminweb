import { get, post, put, patch, del } from "./client";
import type {
  PaginatedResponse,
  AdminStats,
  AdminUserItem,
  FeedbackItem,
  AdminTestSetItem,
  AdminTestSetDetail,
  AdminQuestionItem,
  AdminQuestionDetail,
  AdminSubscriptionItem,
  SubscriptionRevenue,
  StripeEventItem,
  ExplanationStats,
  BatchStatus,
  AdminAttemptItem,
  AdminAttemptDetail,
  AnalyticsOverview,
  AnalyticsInsights,
  TestPopularityItem,
  DifficultyItem,
  AdminWritingItem,
  AdminWritingDetail,
  ImportPreviewResult,
  ImportResult,
  AudioStatus,
  MissingAudioItem,
  AuditLogItem,
  AdminSpeakingAttemptItem,
  VocabPoolStats,
  WordViewStats,
  AnnouncementItem,
  AdminSavedWordItem,
  AdminNihaoWordItem,
  UserActivityData,
  UserDetail,
  NotificationItem,
  QuestionReportItem,
  UserGeoData,
  CostEstimate,
  AdminReferralItem,
  ReferralStats,
  WatermarkUserResult,
  CompetitorItem,
  CompetitorDetail,
  ComparisonMatrix,
  FunnelData,
  SegmentsData,
  FeatureCorrelationData,
  ChurnRiskData,
  CohortRetentionData,
  FeatureAdoptionData,
  LTVData,
  EventsData,
  TrafficData,
  SeoAuditResponse,
  GscResponse,
  GscKeywordRow,
  GscPageRow,
  GscTrendRow,
  GeoCheckResult,
  GeoHistoryResponse,
  GeoPrompt,
  GeoContentItem,
  EmailLogItem,
  EmailStatsResponse,
  EmailDetail,
  TodoItem,
  TimelineEvent,
} from "./types";

// Dashboard
export function fetchAdminStats() {
  return get<AdminStats>("/api/admin/stats");
}

export function fetchTraffic(days = 30) {
  return get<TrafficData>(`/api/admin/traffic?days=${days}`);
}

// Metrics
export interface RouteMetrics {
  total: number;
  errors: number;
  error_rate: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface MetricsSnapshot {
  uptime_seconds: number;
  total_requests: number;
  total_errors: number;
  routes: Record<string, RouteMetrics>;
}

export function fetchMetrics() {
  return get<MetricsSnapshot>("/api/admin/metrics");
}

export function fetchSlowRoutes(threshold = 1.0) {
  return get<{ threshold: number; routes: Array<RouteMetrics & { route: string }> }>(
    `/api/admin/metrics/slow?threshold=${threshold}`,
  );
}

// Users
export function fetchUsers(params: { search?: string; activity_status?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.activity_status) sp.set("activity_status", params.activity_status);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminUserItem>>(`/api/admin/users?${sp}`);
}

export function updateUserRole(userId: string, role: string) {
  return put<{ message: string; role: string }>(`/api/admin/users/${userId}/role`, { role });
}

// Test Sets
export function fetchTestSets(params: { type?: string; exam_type?: string; search?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
  if (params.exam_type) sp.set("exam_type", params.exam_type);
  if (params.search) sp.set("search", params.search);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminTestSetItem>>(`/api/admin/test-sets?${sp}`);
}

export function fetchTestSetDetail(id: string) {
  return get<AdminTestSetDetail>(`/api/admin/test-sets/${id}`);
}

export function createTestSet(data: Record<string, unknown>) {
  return post<{ id: string; message: string }>("/api/admin/test-sets", data);
}

export function updateTestSet(id: string, data: Record<string, unknown>) {
  return put<{ message: string }>(`/api/admin/test-sets/${id}`, data);
}

export function deleteTestSet(id: string) {
  return del<{ message: string }>(`/api/admin/test-sets/${id}`);
}

// Questions
export function fetchQuestions(params: { test_set_id?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params.test_set_id) sp.set("test_set_id", params.test_set_id);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminQuestionItem>>(`/api/admin/questions?${sp}`);
}

export function fetchQuestionDetail(id: string) {
  return get<AdminQuestionDetail>(`/api/admin/questions/${id}`);
}

export function createQuestion(data: Record<string, unknown>) {
  return post<{ id: string; message: string }>("/api/admin/questions", data);
}

export function updateQuestion(id: string, data: Record<string, unknown>) {
  return put<{ message: string }>(`/api/admin/questions/${id}`, data);
}

export function updateAudioTimestamps(id: string, timestamps: import("./types").AudioTimestamp[]) {
  return patch<{ message: string }>(`/api/admin/questions/${id}/audio-timestamps`, {
    audio_timestamps: timestamps,
  });
}

export function deleteQuestion(id: string) {
  return del<{ message: string }>(`/api/admin/questions/${id}`);
}

export function bulkDeleteQuestions(ids: string[]) {
  return post<{ message: string }>("/api/admin/questions/bulk-delete", { ids });
}

// Subscriptions
export function fetchSubscriptions(params: {
  status?: string;
  plan?: string;
  search?: string;
  activity_status?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.plan) sp.set("plan", params.plan);
  if (params.search) sp.set("search", params.search);
  if (params.activity_status) sp.set("activity_status", params.activity_status);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminSubscriptionItem>>(`/api/admin/subscriptions?${sp}`);
}

export function fetchSubscriptionRevenue() {
  return get<SubscriptionRevenue>("/api/admin/subscriptions/revenue");
}

export function extendSubscription(userId: string, days: number) {
  return put<{ message: string }>(`/api/admin/subscriptions/${userId}/extend`, { days });
}

export function cancelSubscription(userId: string) {
  return put<{ message: string }>(`/api/admin/subscriptions/${userId}/cancel`);
}

export function activateSubscription(userId: string, data: { plan: string; days: number }) {
  return put<{ message: string }>(`/api/admin/subscriptions/${userId}/activate`, data);
}

export function fetchStripeEvents(params: {
  event_type?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.event_type) sp.set("event_type", params.event_type);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<StripeEventItem>>(`/api/admin/subscriptions/events?${sp}`);
}

// Explanations
export function fetchExplanationStats() {
  return get<ExplanationStats>("/api/admin/explanations/stats");
}

export function startBatchGeneration(params?: { test_set_id?: string; type?: string; limit?: number }) {
  return post<{ message: string }>("/api/admin/explanations/batch-generate", params || {});
}

export function fetchBatchStatus() {
  return get<BatchStatus>("/api/admin/explanations/batch-status");
}

export function cancelBatchGeneration() {
  return post<{ message: string }>("/api/admin/explanations/batch-cancel");
}

export function generateExplanation(questionId: string) {
  return post<{ message: string }>(`/api/admin/explanations/${questionId}/generate`);
}

export function deleteExplanation(questionId: string) {
  return del<{ message: string }>(`/api/admin/explanations/${questionId}`);
}

// Attempts
export function fetchAttempts(params: {
  user_id?: string;
  test_set_id?: string;
  mode?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.user_id) sp.set("user_id", params.user_id);
  if (params.test_set_id) sp.set("test_set_id", params.test_set_id);
  if (params.mode) sp.set("mode", params.mode);
  if (params.status) sp.set("status", params.status);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminAttemptItem>>(`/api/admin/attempts?${sp}`);
}

export function fetchAttemptDetail(id: string) {
  return get<AdminAttemptDetail>(`/api/admin/attempts/${id}`);
}

// Analytics
export function fetchAnalyticsOverview() {
  return get<AnalyticsOverview>("/api/admin/analytics/overview");
}

export function fetchAnalyticsInsights() {
  return get<AnalyticsInsights>("/api/admin/analytics/insights", { timeout: 60_000 });
}

export function fetchUserActivity(days = 30) {
  return get<UserActivityData>(`/api/admin/analytics/user-activity?days=${days}`, { timeout: 60_000 });
}

export function fetchTestPopularity(params?: { page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<TestPopularityItem>>(`/api/admin/analytics/test-popularity?${sp}`);
}

export function fetchDifficultyRanking(params?: { page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<DifficultyItem>>(`/api/admin/analytics/difficulty?${sp}`);
}

// Writing Submissions
export function fetchWritingSubmissions(params: {
  user_id?: string;
  test_set_id?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.user_id) sp.set("user_id", params.user_id);
  if (params.test_set_id) sp.set("test_set_id", params.test_set_id);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminWritingItem>>(`/api/admin/writing-submissions?${sp}`);
}

export function fetchWritingSubmissionDetail(id: string) {
  return get<AdminWritingDetail>(`/api/admin/writing-submissions/${id}`);
}

// Data Operations - Import
export function previewImport(data: { test_set_id: string; questions: Record<string, unknown>[] }) {
  return post<ImportPreviewResult>("/api/admin/import/questions/preview", data);
}

export function importQuestions(data: { test_set_id: string; questions: Record<string, unknown>[] }) {
  return post<ImportResult>("/api/admin/import/questions", data);
}

// Data Operations - Export
export function exportTestSet(id: string) {
  return get<Record<string, unknown>>(`/api/admin/export/test-set/${id}`);
}

export function exportQuestions(params?: { test_set_id?: string; type?: string }) {
  const sp = new URLSearchParams();
  if (params?.test_set_id) sp.set("test_set_id", params.test_set_id);
  if (params?.type) sp.set("type", params.type);
  return get<Record<string, unknown>>(`/api/admin/export/questions?${sp}`);
}

// Data Operations - Audio
export function fetchAudioStatus() {
  return get<AudioStatus>("/api/admin/audio/status");
}

export function fetchMissingAudio(params?: { page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<MissingAudioItem>>(`/api/admin/audio/missing?${sp}`);
}

export function setAudioUrl(questionId: string, audioUrl: string) {
  return post<{ message: string }>(`/api/admin/audio/${questionId}/url`, { audio_url: audioUrl });
}

export function generateUploadUrl(blobName: string) {
  return post<{ upload_url: string; blob_name: string }>("/api/admin/audio/generate-upload-url", { blob_name: blobName });
}

// Audit Logs
export function fetchAuditLogs(params: {
  action?: string;
  admin_email?: string;
  target_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.action) sp.set("action", params.action);
  if (params.admin_email) sp.set("admin_email", params.admin_email);
  if (params.target_type) sp.set("target_type", params.target_type);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AuditLogItem>>(`/api/admin/audit-logs?${sp}`);
}

// Feedback
export function fetchFeedback(params: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.status) sp.set("status", params.status);
  if (params.search) sp.set("search", params.search);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<FeedbackItem>>(`/api/admin/feedback?${sp}`);
}

export function updateFeedback(
  id: string,
  data: { status: string; admin_note?: string },
) {
  return put<FeedbackItem>(`/api/admin/feedback/${id}`, data);
}

// Speaking Attempts
export function fetchSpeakingAttempts(params: {
  user_id?: string;
  mode?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.user_id) sp.set("user_id", params.user_id);
  if (params.mode) sp.set("mode", params.mode);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminSpeakingAttemptItem>>(
    `/api/admin/speaking-attempts?${sp}`,
  );
}

// Vocabulary Admin
export function fetchVocabStats() {
  return get<VocabPoolStats>("/api/admin/vocab/stats");
}

export function fetchWordViewStats(days = 30) {
  return get<WordViewStats>(`/api/admin/vocab/view-stats?days=${days}`);
}

export function fetchAdminSavedWords(params: {
  user_id?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.user_id) sp.set("user_id", params.user_id);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminSavedWordItem>>(
    `/api/admin/vocab/saved-words?${sp}`,
  );
}

export function fetchAdminNihaoWords(params: {
  level?: string;
  lesson?: number;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.level) sp.set("level", params.level);
  if (params.lesson) sp.set("lesson", String(params.lesson));
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminNihaoWordItem>>(
    `/api/admin/vocab/nihao-words?${sp}`,
  );
}

export function updateNihaoWord(
  id: string,
  data: Record<string, unknown>,
) {
  return put<{ message: string }>(`/api/admin/vocab/nihao-words/${id}`, data);
}

// Cost Estimate
export function fetchCostEstimate() {
  return get<CostEstimate>("/api/admin/cost-estimate");
}

// User Geo
export function fetchUserGeo() {
  return get<UserGeoData>("/api/admin/users/geo");
}

// User Detail
export function fetchUserDetail(userId: string) {
  return get<UserDetail>(`/api/admin/users/${userId}/detail`, { timeout: 60_000 });
}

// User Timeline
export function fetchUserTimeline(userId: string) {
  return get<{ events: TimelineEvent[] }>(`/api/admin/users/${userId}/timeline`, { timeout: 60_000 });
}

// Notifications
export function fetchNotifications() {
  return get<{ notifications: NotificationItem[] }>("/api/admin/notifications/recent");
}

// Question Reports
export function fetchQuestionReports(params?: { status?: string; issue_type?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.issue_type) sp.set("issue_type", params.issue_type);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<QuestionReportItem>>(`/api/admin/question-reports?${sp}`);
}

export function resolveQuestionReport(reportId: string) {
  return put<{ message: string }>(`/api/admin/question-reports/${reportId}/resolve`, {});
}

// ── Referrals ─────────────────────────────────────────────────
export function fetchReferrals(params?: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<{ items: AdminReferralItem[]; total: number; page: number; page_size: number }>(
    `/api/admin/referrals?${sp}`,
  );
}

export function fetchReferralStats() {
  return get<ReferralStats>("/api/admin/referrals/stats");
}

export function markReferralFraud(referralId: string) {
  return put<{ message: string }>(`/api/admin/referrals/${referralId}/mark-fraud`, {});
}

// ── Watermark Lookup & User Lock ────────────────────────────
export function searchByWatermark(suffix: string) {
  return get<WatermarkUserResult[]>(`/api/admin/users/by-watermark/${suffix}`);
}

export function lockUser(userId: string, reason: string) {
  return post<{ message: string; is_locked: boolean }>(`/api/admin/users/${userId}/lock`, { reason });
}

export function unlockUser(userId: string) {
  return post<{ message: string; is_locked: boolean }>(`/api/admin/users/${userId}/unlock`);
}

// ── Competitors ─────────────────────────────────────────────
export function fetchCompetitors(params?: { search?: string; status?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<CompetitorItem>>(`/api/admin/competitors?${sp}`);
}

export function fetchCompetitorDetail(id: string) {
  return get<CompetitorDetail>(`/api/admin/competitors/${id}`);
}

export function fetchComparisonMatrix() {
  return get<ComparisonMatrix>("/api/admin/competitors/comparison");
}

export function createCompetitor(data: Record<string, unknown>) {
  return post<CompetitorItem>("/api/admin/competitors", data);
}

export function updateCompetitor(id: string, data: Record<string, unknown>) {
  return put<CompetitorItem>(`/api/admin/competitors/${id}`, data);
}

export function deleteCompetitor(id: string) {
  return del<{ message: string }>(`/api/admin/competitors/${id}`);
}

export function checkCompetitor(id: string) {
  return post<import("./types").MonitorSnapshot>(`/api/admin/competitors/${id}/check`);
}

export function checkAllCompetitors() {
  return post<{ checked: number; results: Array<{ id: string; name: string; is_up: boolean; status_code: number; notes: string }> }>("/api/admin/competitors/check-all");
}

// ── Funnel & Advanced Analytics ─────────────────────────────
export function fetchFunnel(days = 30) {
  return get<FunnelData>(`/api/admin/analytics/funnel?days=${days}`, { timeout: 60_000 });
}

export function fetchSegments(days = 90) {
  return get<SegmentsData>(`/api/admin/analytics/segments?days=${days}`, { timeout: 60_000 });
}

export function fetchFeatureCorrelation(days = 90) {
  return get<FeatureCorrelationData>(`/api/admin/analytics/feature-correlation?days=${days}`, { timeout: 60_000 });
}

export function fetchChurnRisk(inactiveDays = 14) {
  return get<ChurnRiskData>(`/api/admin/analytics/churn-risk?inactive_days=${inactiveDays}`, { timeout: 60_000 });
}

export function fetchCohortRetention(granularity: "weekly" | "monthly" = "weekly", cohorts = 12) {
  return get<CohortRetentionData>(`/api/admin/analytics/cohort-retention?granularity=${granularity}&cohorts=${cohorts}`, { timeout: 60_000 });
}

export function fetchFeatureAdoption(days = 90) {
  return get<FeatureAdoptionData>(`/api/admin/analytics/feature-adoption?days=${days}`, { timeout: 60_000 });
}

export function fetchLTV() {
  return get<LTVData>("/api/admin/analytics/ltv", { timeout: 60_000 });
}

export function fetchEvents(params?: { event?: string; user_id?: string; days?: number; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.event) sp.set("event", params.event);
  if (params?.user_id) sp.set("user_id", params.user_id);
  if (params?.days) sp.set("days", String(params.days));
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<EventsData>(`/api/admin/analytics/events?${sp}`, { timeout: 60_000 });
}

// ---- 运营工作台 (Ops Workbench) ----

import type {
  OpsContentDraft,
  OpsReplyScenario,
  OpsAssetItem,
  OpsPerformanceSummary,
  OpsCalendarData,
  OpsGenerateResult,
} from "./types";

// Drafts
export function fetchOpsDrafts(params?: { search?: string; status?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<OpsContentDraft>>(`/api/admin/ops/drafts?${sp}`);
}

export function generateOpsDrafts(data: { topic: string; angle?: string; tone?: string; count?: number }) {
  return post<OpsGenerateResult>("/api/admin/ops/drafts/generate", data, { timeout: 60_000 });
}

export function getOpsDraft(id: string) {
  return get<OpsContentDraft>(`/api/admin/ops/drafts/${id}`);
}

export function updateOpsDraft(id: string, data: Partial<OpsContentDraft>) {
  return put<OpsContentDraft>(`/api/admin/ops/drafts/${id}`, data);
}

export function deleteOpsDraft(id: string) {
  return del<{ message: string }>(`/api/admin/ops/drafts/${id}`);
}

export function checkDraftBannedWords(id: string) {
  return post<{ banned_words_found: string[]; count: number }>(`/api/admin/ops/drafts/${id}/check-banned`, {});
}

export function updateDraftPerformance(id: string, data: { views?: number; likes?: number; comments?: number; saves?: number; shares?: number; signups_attributed?: number }) {
  return put<OpsContentDraft>(`/api/admin/ops/drafts/${id}/performance`, data);
}

// Calendar
export function fetchOpsCalendar(year: number, month: number) {
  return get<OpsCalendarData>(`/api/admin/ops/calendar?year=${year}&month=${month}`);
}

// Reply Library
export function fetchOpsReplies(params?: { search?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<OpsReplyScenario>>(`/api/admin/ops/replies?${sp}`);
}

export function createOpsReply(data: { name: string; description?: string; replies?: { text: string }[] }) {
  return post<OpsReplyScenario>("/api/admin/ops/replies", data);
}

export function updateOpsReply(id: string, data: Partial<OpsReplyScenario>) {
  return put<OpsReplyScenario>(`/api/admin/ops/replies/${id}`, data);
}

export function deleteOpsReply(id: string) {
  return del<{ message: string }>(`/api/admin/ops/replies/${id}`);
}

export function generateReplyVariations(id: string, count = 5) {
  return post<OpsReplyScenario>(`/api/admin/ops/replies/${id}/generate`, { count }, { timeout: 60_000 });
}

export function markReplyUsed(scenarioId: string, variationIndex: number) {
  return put<OpsReplyScenario>(`/api/admin/ops/replies/${scenarioId}/use/${variationIndex}`, {});
}

// Performance
export function fetchOpsPerformanceSummary() {
  return get<OpsPerformanceSummary>("/api/admin/ops/performance/summary");
}

// Assets
export function fetchOpsAssets(params?: { search?: string; tag?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<OpsAssetItem>>(`/api/admin/ops/assets?${sp}`);
}

export function createOpsAsset(data: { filename: string; blob_url: string; content_type?: string; size_bytes?: number; tags?: string[]; description?: string }) {
  return post<OpsAssetItem>("/api/admin/ops/assets", data);
}

export function updateOpsAsset(id: string, data: Partial<OpsAssetItem>) {
  return put<OpsAssetItem>(`/api/admin/ops/assets/${id}`, data);
}

export function deleteOpsAsset(id: string) {
  return del<{ message: string }>(`/api/admin/ops/assets/${id}`);
}

export function fetchBannedWords() {
  return get<{ words: string[]; count: number }>("/api/admin/ops/banned-words");
}

// Announcements
export function fetchAnnouncements(params?: { page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AnnouncementItem>>(`/api/admin/announcements?${sp}`);
}

export function createAnnouncement(data: {
  title: Record<string, string>;
  content: Record<string, string>;
  type: string;
}) {
  return post<{ id: string; message: string }>("/api/admin/announcements", data);
}

export function updateAnnouncement(id: string, data: {
  title?: Record<string, string>;
  content?: Record<string, string>;
  type?: string;
}) {
  return put<{ message: string }>(`/api/admin/announcements/${id}`, data);
}

export function deleteAnnouncement(id: string) {
  return del<{ message: string }>(`/api/admin/announcements/${id}`);
}

// ── Anomaly Alerts ──────────────────────────────────────────

export interface AnomalyAlertItem {
  id: string;
  user_id: string;
  user_email: string;
  alert_type: string;
  severity: string;
  count: number;
  window_seconds: number;
  details: Record<string, unknown>;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export interface AnomalySummary {
  total_open: number;
  by_type_severity: Array<{
    alert_type: string;
    severity: string;
    count: number;
  }>;
}

export function fetchAnomalies(params?: {
  status?: string;
  alert_type?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.alert_type) sp.set("alert_type", params.alert_type);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return get<PaginatedResponse<AnomalyAlertItem>>(
    `/api/admin/anomalies${qs ? `?${qs}` : ""}`,
  );
}

export function fetchAnomalySummary() {
  return get<AnomalySummary>("/api/admin/anomalies/summary");
}

export function updateAnomaly(id: string, data: { status?: string; admin_note?: string }) {
  return put<{ ok: boolean }>(`/api/admin/anomalies/${id}`, data);
}

// ── Audio Review ──────────────────────────────────────────────

export interface AudioReviewQuestion {
  id: string;
  test_set_code: string;
  test_set_name: string;
  question_number: number;
  level: string | null;
  has_image: boolean;
  correct_answer: string | null;
  segment_count: number;
  labeled_count: number;
  audio_review_status: string | null;
  has_user_report: boolean;
  audio_quality_grade: string | null;
  audio_quality_snr: number | null;
  audio_quality_bw: number | null;
}

export interface AudioReviewProgress {
  total_questions: number;
  total_segments: number;
  labeled_segments: number;
  label_pct: number;
  quality_counts: {
    good: number;
    moderate: number;
    severe: number;
    unscanned: number;
  };
}

export interface AudioReviewListResponse {
  items: AudioReviewQuestion[];
  total: number;
  page: number;
  page_size: number;
  progress: AudioReviewProgress;
}

export interface AudioReviewTestSet {
  code: string;
  name: string;
  order: number;
}

export function fetchAudioReviewList(params?: {
  test_set_code?: string;
  status?: string;
  quality?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.test_set_code) sp.set("test_set_code", params.test_set_code);
  if (params?.status) sp.set("status", params.status);
  if (params?.quality) sp.set("quality", params.quality);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return get<AudioReviewListResponse>(`/api/admin/audio-review?${sp}`);
}

export function fetchAudioReviewTestSets() {
  return get<AudioReviewTestSet[]>("/api/admin/audio-review/test-sets");
}

export interface AudioReviewDetailSegment {
  text: string;
  start: number;
  end: number;
  sentence_index: number | null;
  en: string | null;
  zh: string | null;
  ar: string | null;
  is_key: boolean | null;
  voice_label: string | null;
}

export interface AudioReviewDetail {
  id: string;
  test_set_code: string;
  test_set_name: string;
  question_number: number;
  level: string | null;
  has_image: boolean;
  audio_url: string | null;
  audio_sas_url: string | null;
  image_sas_url: string | null;
  transcript: string | null;
  correct_answer: string | null;
  audio_quality: Record<string, unknown> | null;
  options: { key: string; text: string }[];
  audio_timestamps: AudioReviewDetailSegment[];
  explanation: {
    question_text_zh: string | null;
    question_text_en: string | null;
    option_translations: Record<string, unknown> | null;
  };
}

export function fetchAudioReviewDetail(id: string) {
  return get<AudioReviewDetail>(`/api/admin/audio-review/${id}`);
}

export function updateAudioQualityGrade(id: string, grade: string) {
  return put<{ ok: boolean; grade: string }>(
    `/api/admin/audio-review/${id}/quality`,
    { grade },
  );
}

export function saveAudioReviewTimestamps(
  id: string,
  data: {
    timestamps: AudioReviewDetailSegment[];
    audio_review_status?: string;
  },
) {
  return put<{ ok: boolean; segment_count: number }>(
    `/api/admin/audio-review/${id}/timestamps`,
    data,
  );
}

// ── Scrape Data ──────────────────────────────────────────────

import type {
  ScrapeSource,
  ScrapeTest,
  ScrapePreview,
} from "./types";

export function fetchScrapeSources() {
  return get<{ sources: ScrapeSource[] }>("/api/admin/scrape-data/sources");
}

export function fetchScrapeTests(source: string, type: string) {
  const sp = new URLSearchParams();
  sp.set("source", source);
  sp.set("type", type);
  return get<{ tests: ScrapeTest[] }>(`/api/admin/scrape-data/tests?${sp}`);
}

export function fetchScrapePreview(source: string, type: string, test: number) {
  const sp = new URLSearchParams();
  sp.set("source", source);
  sp.set("type", type);
  sp.set("test", String(test));
  return get<ScrapePreview>(`/api/admin/scrape-data/preview?${sp}`);
}

// SEO Audit
export function fetchSeoAudit(urls?: string) {
  const sp = new URLSearchParams();
  if (urls) sp.set("urls", urls);
  return get<SeoAuditResponse>(`/api/admin/seo/audit?${sp}`);
}

// GSC (Google Search Console)
export function fetchGscKeywords(days = 28, limit = 50) {
  return get<GscResponse<GscKeywordRow>>(`/api/admin/gsc/keywords?days=${days}&limit=${limit}`);
}

export function fetchGscPages(days = 28, limit = 20) {
  return get<GscResponse<GscPageRow>>(`/api/admin/gsc/pages?days=${days}&limit=${limit}`);
}

export function fetchGscTrend(days = 28, keyword?: string) {
  const sp = new URLSearchParams();
  sp.set("days", String(days));
  if (keyword) sp.set("keyword", keyword);
  return get<GscResponse<GscTrendRow>>(`/api/admin/gsc/trend?${sp}`);
}

// GEO (Generative Engine Optimization)
export function fetchGeoCheck(promptId?: string) {
  const sp = new URLSearchParams();
  if (promptId) sp.set("prompt_id", promptId);
  return post<{ results: GeoCheckResult[]; total_prompts: number }>(`/api/admin/geo/check?${sp}`);
}

export function fetchGeoHistory(days = 30) {
  return get<GeoHistoryResponse>(`/api/admin/geo/history?days=${days}`);
}

export function fetchGeoPrompts() {
  return get<{ prompts: GeoPrompt[] }>("/api/admin/geo/prompts");
}

export function fetchGeoContent() {
  return get<{ items: GeoContentItem[]; total: number }>("/api/admin/geo/content");
}

export function addGeoContent(item: { url: string; title: string; platform: string; lang?: string; notes?: string }) {
  return post<GeoContentItem>("/api/admin/geo/content", item);
}

export function seedGeoContent() {
  return post<{ inserted: number; total: number }>("/api/admin/geo/content/seed");
}

export function deleteGeoContent(id: string) {
  return del<{ ok: boolean }>(`/api/admin/geo/content/${id}`);
}

// Email logs
export function fetchEmailLogs(params: {
  email_type?: string;
  status?: string;
  search?: string;
  user_id?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.email_type) sp.set("email_type", params.email_type);
  if (params.status) sp.set("status", params.status);
  if (params.search) sp.set("search", params.search);
  if (params.user_id) sp.set("user_id", params.user_id);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<EmailLogItem>>(`/api/admin/emails?${sp}`);
}

export function fetchEmailStats() {
  return get<EmailStatsResponse>("/api/admin/emails/stats");
}

export function fetchEmailDetail(emailId: string) {
  return get<EmailDetail>(`/api/admin/emails/${emailId}`);
}

// Todos
export function fetchTodos(status?: string) {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  const qs = sp.toString();
  return get<TodoItem[]>(`/api/admin/todos${qs ? `?${qs}` : ""}`);
}

export function createTodo(data: { title: string; description?: string; priority?: string }) {
  return post<{ id: string; message: string }>("/api/admin/todos", data);
}

export function updateTodo(id: string, data: { title?: string; description?: string; status?: string; priority?: string }) {
  return put<{ message: string }>(`/api/admin/todos/${id}`, data);
}

export function deleteTodo(id: string) {
  return del<{ message: string }>(`/api/admin/todos/${id}`);
}
