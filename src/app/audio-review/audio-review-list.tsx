"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchAudioReviewList,
  fetchAudioReviewTestSets,
  fetchAudioReviewDetail,
  updateAudioQualityGrade,
  type AudioReviewListResponse,
  type AudioReviewTestSet,
} from "@/lib/api/admin";
import { AlertCircle, RotateCcw, Flag, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  reviewed: { label: "已审核", color: "bg-green-100 text-green-800" },
  partial: { label: "部分标记", color: "bg-blue-100 text-blue-800" },
  unlabeled: { label: "未标记", color: "bg-gray-100 text-gray-800" },
  no_timestamps: { label: "无时间戳", color: "bg-red-100 text-red-800" },
};

const QUALITY_STYLES: Record<string, { label: string; color: string }> = {
  severe: { label: "严重", color: "bg-red-100 text-red-800" },
  moderate: { label: "一般", color: "bg-yellow-100 text-yellow-800" },
  good: { label: "良好", color: "bg-green-100 text-green-800" },
};

export function AudioReviewList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AudioReviewListResponse | null>(null);
  const [testSets, setTestSets] = useState<AudioReviewTestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tsFilter, setTsFilter] = useState(searchParams.get("ts") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [qualityFilter, setQualityFilter] = useState(searchParams.get("quality") || "all");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async (e: React.MouseEvent, qId: string) => {
    e.stopPropagation();
    if (playingId === qId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    try {
      const detail = await fetchAudioReviewDetail(qId);
      if (!detail.audio_sas_url) return;
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(detail.audio_sas_url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.play();
      setPlayingId(qId);
    } catch { /* ignore */ }
  };

  const handleQualityPass = async (e: React.MouseEvent, qId: string) => {
    e.stopPropagation();
    await updateAudioQualityGrade(qId, "good");
    load();
  };

  // Sync filters to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (tsFilter !== "all") sp.set("ts", tsFilter);
    if (qualityFilter !== "all") sp.set("quality", qualityFilter);
    if (statusFilter !== "all") sp.set("status", statusFilter);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    router.replace(`/audio-review${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [tsFilter, qualityFilter, statusFilter, page, router]);

  useEffect(() => {
    fetchAudioReviewTestSets().then(setTestSets).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAudioReviewList({
        test_set_code: tsFilter === "all" ? undefined : tsFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        quality: qualityFilter === "all" ? undefined : qualityFilter,
        page,
        page_size: 50,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [tsFilter, statusFilter, qualityFilter, page]);

  useEffect(() => { load(); }, [load]);

  const progress = data?.progress;
  const qc = progress?.quality_counts;

  return (
    <div className="space-y-4">
      {/* Progress stats */}
      {progress && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span>音色标记进度</span>
              <span className="font-medium">{progress.labeled_segments} / {progress.total_segments} 句 ({progress.label_pct}%)</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.label_pct}%` }}
              />
            </div>
          </div>
          {qc && (
            <div className="rounded-lg border p-4">
              <div className="text-sm mb-2">音质分布</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  严重 <span className="font-medium">{qc.severe}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  一般 <span className="font-medium">{qc.moderate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  良好 <span className="font-medium">{qc.good}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  未扫描 <span className="font-medium">{qc.unscanned}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={tsFilter} onValueChange={(v) => { setTsFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="套题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部套题</SelectItem>
            {testSets.map((ts) => (
              <SelectItem key={ts.code} value={ts.code}>{ts.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={qualityFilter} onValueChange={(v) => { setQualityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="音质" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部音质</SelectItem>
            <SelectItem value="severe">严重</SelectItem>
            <SelectItem value="moderate">一般</SelectItem>
            <SelectItem value="good">良好</SelectItem>
            <SelectItem value="unscanned">未扫描</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="标记状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="unlabeled">未标记</SelectItem>
            <SelectItem value="reviewed">已审核</SelectItem>
            <SelectItem value="needs_reprocess">需处理</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="暂无数据" description="没有符合条件的听力题目" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>套题</TableHead>
                <TableHead>题号</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>音质</TableHead>
                <TableHead className="text-right">SNR</TableHead>
                <TableHead className="text-right">带宽</TableHead>
                <TableHead>已标记</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((q) => {
                const qs = QUALITY_STYLES[q.audio_quality_grade || ""] || null;
                return (
                  <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/audio-review/${q.id}`)}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handlePlay(e, q.id)}
                      >
                        {playingId === q.id ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">{q.test_set_name}</TableCell>
                    <TableCell className="font-medium">Q{q.question_number}</TableCell>
                    <TableCell className="text-xs">{q.level || "-"}</TableCell>
                    <TableCell>
                      {qs ? (
                        <Badge variant="secondary" className={qs.color}>{qs.label}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-right text-xs">
                      {q.audio_quality_snr != null ? `${q.audio_quality_snr}dB` : "-"}
                    </TableCell>
                    <TableCell className="tabular-nums text-right text-xs">
                      {q.audio_quality_bw != null ? `${(q.audio_quality_bw / 1000).toFixed(1)}kHz` : "-"}
                    </TableCell>
                    <TableCell className="tabular-nums">{q.labeled_count}/{q.segment_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {q.audio_quality_grade && q.audio_quality_grade !== "good" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-green-700 hover:bg-green-50"
                            onClick={(e) => handleQualityPass(e, q.id)}
                          >
                            <Check className="mr-0.5 h-3 w-3" /> 通过
                          </Button>
                        )}
                        {q.has_user_report && (
                          <Flag className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {data.total > 50 && (
            <Pagination
              page={data.page}
              totalPages={Math.ceil(data.total / data.page_size)}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
