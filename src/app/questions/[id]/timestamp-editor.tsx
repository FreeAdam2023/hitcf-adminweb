"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Save, Plus, Trash2, RotateCcw } from "lucide-react";
import { updateAudioTimestamps } from "@/lib/api/admin";
import type { AudioTimestamp } from "@/lib/api/types";
import { toast } from "sonner";

interface TimestampEditorProps {
  questionId: string;
  audioUrl: string | null;
  initial: AudioTimestamp[] | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

export function TimestampEditor({ questionId, audioUrl, initial }: TimestampEditorProps) {
  const [segments, setSegments] = useState<AudioTimestamp[]>(initial ?? []);
  const [originalSegments] = useState<AudioTimestamp[]>(initial ?? []);
  const [saving, setSaving] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  // Load audio SAS URL
  useEffect(() => {
    if (!audioUrl) return;
    fetch(`/api/media/audio/${questionId}`)
      .then((r) => r.json())
      .then((data) => setAudioSrc(data.url))
      .catch(() => toast.error("Failed to load audio URL"));
  }, [audioUrl, questionId]);

  // Animation frame for current time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setCurrentTime(audio.currentTime);
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animRef.current);
  }, [audioSrc]);

  const playSegment = useCallback((idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seg = segments[idx];
    if (!seg) return;
    audio.currentTime = seg.start;
    audio.play();
    setPlayingIdx(idx);
    const checkEnd = () => {
      if (audio.currentTime >= seg.end) {
        audio.pause();
        setPlayingIdx(null);
        audio.removeEventListener("timeupdate", checkEnd);
      }
    };
    audio.addEventListener("timeupdate", checkEnd);
  }, [segments]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setPlayingIdx(null);
  }, []);

  const updateSegment = useCallback((idx: number, field: keyof AudioTimestamp, value: string | number) => {
    setSegments((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }, []);

  const addSegment = useCallback(() => {
    const last = segments[segments.length - 1];
    const newStart = last ? last.end : 0;
    setSegments((prev) => [
      ...prev,
      { text: "", start: newStart, end: newStart + 2, sentence_index: prev.length },
    ]);
  }, [segments]);

  const removeSegment = useCallback((idx: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const resetSegments = useCallback(() => {
    setSegments(originalSegments);
  }, [originalSegments]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Re-index sentence_index sequentially
      const normalized = segments.map((seg, i) => ({
        ...seg,
        sentence_index: i,
        start: Number(seg.start),
        end: Number(seg.end),
      }));
      await updateAudioTimestamps(questionId, normalized);
      toast.success(`Saved ${normalized.length} segments`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(segments) !== JSON.stringify(originalSegments);

  if (!initial?.length && !audioUrl) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Audio Timestamps</CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addSegment}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetSegments} disabled={!hasChanges}>
            <RotateCcw className="mr-1 h-3 w-3" /> Reset
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="mr-1 h-3 w-3" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Player */}
        {audioSrc && (
          <div className="space-y-1">
            <audio
              ref={audioRef}
              src={audioSrc}
              onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
              className="w-full"
              controls
            />
            <p className="text-xs text-muted-foreground">
              Current: {formatTime(currentTime)} / {formatTime(audioDuration)}
            </p>
          </div>
        )}

        {/* Segments Table */}
        {segments.length > 0 ? (
          <div className="space-y-1">
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_3rem_3rem] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>#</span>
              <span>Text</span>
              <span>Start</span>
              <span>End</span>
              <span></span>
              <span></span>
            </div>
            {segments.map((seg, i) => {
              const isActive = currentTime >= seg.start && currentTime < seg.end;
              return (
                <div
                  key={i}
                  className={`grid grid-cols-[2rem_1fr_5rem_5rem_3rem_3rem] gap-2 items-center rounded px-1 py-0.5 ${
                    isActive ? "bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{i}</span>
                  <Input
                    value={seg.text}
                    onChange={(e) => updateSegment(i, "text", e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={seg.start}
                    onChange={(e) => updateSegment(i, "start", parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={seg.end}
                    onChange={(e) => updateSegment(i, "end", parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => playingIdx === i ? stopPlayback() : playSegment(i)}
                  >
                    {playingIdx === i ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => removeSegment(i)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No audio timestamps. Use &quot;Add&quot; to create segments manually.</p>
        )}
      </CardContent>
    </Card>
  );
}
