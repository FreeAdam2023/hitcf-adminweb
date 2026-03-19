"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAudioReviewDetail,
  saveAudioReviewTimestamps,
  type AudioReviewDetail,
  type AudioReviewDetailSegment,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  ArrowLeft,
  Play,
  Pause,
  Save,
  Trash2,
  Volume2,
} from "lucide-react";

const VOICE_LABELS = [
  { value: "", label: "未标记" },
  { value: "female_announcer", label: "女播音" },
  { value: "male_announcer", label: "男播音" },
  { value: "female", label: "成年女声" },
  { value: "male", label: "成年男声" },
  { value: "child_female", label: "女童" },
  { value: "child_male", label: "男童" },
  { value: "narrator", label: "旁白" },
];

const QUALITY_STYLES: Record<string, { label: string; color: string }> = {
  severe: { label: "严重", color: "bg-red-100 text-red-800" },
  moderate: { label: "一般", color: "bg-yellow-100 text-yellow-800" },
  good: { label: "良好", color: "bg-green-100 text-green-800" },
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

export default function AudioReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<AudioReviewDetail | null>(null);
  const [segments, setSegments] = useState<AudioReviewDetailSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAudioReviewDetail(id);
      setData(res);
      setSegments(res.audio_timestamps.map((s) => ({ ...s })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Play a specific segment
  const playSegment = (idx: number) => {
    const seg = segments[idx];
    const audio = audioRef.current;
    if (!audio || !data?.audio_sas_url) return;

    if (playingIdx === idx) {
      audio.pause();
      setPlayingIdx(null);
      return;
    }

    audio.currentTime = seg.start;
    audio.play();
    setPlayingIdx(idx);

    // Stop at segment end
    const checkEnd = () => {
      if (audio.currentTime >= seg.end) {
        audio.pause();
        setPlayingIdx(null);
        audio.removeEventListener("timeupdate", checkEnd);
      }
    };
    audio.addEventListener("timeupdate", checkEnd);
  };

  // Update segment text
  const updateText = (idx: number, text: string) => {
    setSaved(false);
    setSegments((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
  };

  // Update voice label
  const updateVoiceLabel = (idx: number, voice_label: string) => {
    setSaved(false);
    setSegments((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, voice_label: voice_label || null } : s,
      ),
    );
  };

  // Delete segment
  const deleteSegment = (idx: number) => {
    setSaved(false);
    setSegments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAudioReviewTimestamps(id, {
        timestamps: segments,
        audio_review_status: "reviewed",
      });
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error || "未找到"}</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回
        </Button>
      </div>
    );
  }

  const aq = data.audio_quality as Record<string, number | string> | null;
  const grade = aq?.grade as string | undefined;
  const qs = grade ? QUALITY_STYLES[grade] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {data.test_set_name} · Q{data.question_number}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>等级: {data.level || "-"}</span>
            <span>答案: {data.correct_answer || "-"}</span>
            {qs && (
              <Badge variant="secondary" className={qs.color}>
                音质: {qs.label}
              </Badge>
            )}
            {aq && (
              <>
                <span>SNR: {String(aq.snr)}dB</span>
                <span>带宽: {((aq.spectral_bandwidth as number) / 1000).toFixed(1)}kHz</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || saved}>
          <Save className="mr-1 h-4 w-4" />
          {saved ? "已保存" : saving ? "保存中..." : "保存"}
        </Button>
      </div>

      {/* Audio player */}
      {data.audio_sas_url && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Volume2 className="h-4 w-4" /> 音频播放
          </div>
          <audio ref={audioRef} src={data.audio_sas_url} controls className="w-full" />
        </div>
      )}

      {/* Image */}
      {data.has_image && data.image_sas_url && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium mb-2">题目图片</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image_sas_url}
            alt={`Q${data.question_number}`}
            className="max-h-64 rounded"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: segments */}
        <div className="lg:col-span-2 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium">
              转录句段 ({segments.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              已标记 {segments.filter((s) => s.voice_label).length}/{segments.length}
            </span>
          </div>
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                playingIdx === idx ? "border-primary bg-primary/5" : ""
              }`}
            >
              {/* Play button */}
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 h-7 w-7 shrink-0"
                onClick={() => playSegment(idx)}
              >
                {playingIdx === idx ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>

              {/* Time */}
              <span className="mt-1 shrink-0 text-xs tabular-nums text-muted-foreground w-24">
                {formatTime(seg.start)}-{formatTime(seg.end)}
              </span>

              {/* Text input */}
              <Input
                value={seg.text}
                onChange={(e) => updateText(idx, e.target.value)}
                className="h-8 flex-1 text-sm"
              />

              {/* Voice label */}
              <Select
                value={seg.voice_label || ""}
                onValueChange={(v) => updateVoiceLabel(idx, v)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="标记" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_LABELS.map((vl) => (
                    <SelectItem key={vl.value} value={vl.value || "none"}>
                      {vl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteSegment(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Right: question info */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium mb-3">题目选项</h3>
            <div className="space-y-2">
              {data.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    opt.key === data.correct_answer
                      ? "border-green-300 bg-green-50 font-medium"
                      : ""
                  }`}
                >
                  <span className="font-medium">{opt.key}.</span> {opt.text}
                </div>
              ))}
            </div>
          </div>

          {data.explanation?.question_text_zh && (
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">题目翻译</h3>
              <p className="text-sm text-muted-foreground">
                {data.explanation.question_text_zh}
              </p>
            </div>
          )}

          {aq && (
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">音质详情</h3>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">采样率</span>
                <span>{String(aq.original_sample_rate || "-")} Hz</span>
                <span className="text-muted-foreground">比特率</span>
                <span>{String(aq.original_bitrate || "-")} kbps</span>
                <span className="text-muted-foreground">时长</span>
                <span>{String(aq.duration || "-")} s</span>
                <span className="text-muted-foreground">SNR</span>
                <span>{String(aq.snr || "-")} dB</span>
                <span className="text-muted-foreground">带宽</span>
                <span>{String(aq.spectral_bandwidth || "-")} Hz</span>
                <span className="text-muted-foreground">RMS</span>
                <span>{String(aq.rms_energy || "-")}</span>
                <span className="text-muted-foreground">静音占比</span>
                <span>{String(aq.silence_pct || "-")}%</span>
                <span className="text-muted-foreground">噪声ZCR</span>
                <span>{String(aq.pause_zcr || "-")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
