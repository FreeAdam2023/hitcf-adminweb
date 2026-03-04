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
  AdminSavedWordItem,
  AdminNihaoWordItem,
} from "./types";

// Dashboard
export function fetchAdminStats() {
  return get<AdminStats>("/api/admin/stats");
}

// Users
export function fetchUsers(params: { search?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  return get<PaginatedResponse<AdminUserItem>>(`/api/admin/users?${sp}`);
}

export function updateUserRole(userId: string, role: string) {
  return put<{ message: string; role: string }>(`/api/admin/users/${userId}/role`, { role });
}

// Test Sets
export function fetchTestSets(params: { type?: string; search?: string; page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
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
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.plan) sp.set("plan", params.plan);
  if (params.search) sp.set("search", params.search);
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
