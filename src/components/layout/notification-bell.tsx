"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, UserPlus, CreditCard, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchNotifications } from "@/lib/api/admin";
import type { NotificationItem } from "@/lib/api/types";

const POLL_INTERVAL = 120_000; // 2 minutes
const CLEARED_AT_KEY = "hitcf_notif_cleared_at";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

// ── Web Audio notification sounds ──────────────────────────────
function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // audio not available
  }
}

/** Metallic coin-drop sound effect (multiple harmonics + noise burst) */
function playCoinDrop(ctx: AudioContext, startTime: number) {
  // — Coin 1: high metallic ping —
  const f1 = [2637, 3520, 4186]; // E7, A7, C8 harmonics
  f1.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.15 / (i + 1), startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
    osc.start(startTime);
    osc.stop(startTime + 0.15);
  });

  // — Coin 2: second coin hit (slightly delayed, lower) —
  const t2 = startTime + 0.12;
  const f2 = [2093, 3136, 3951];
  f2.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t2);
    gain.gain.setValueAtTime(0.12 / (i + 1), t2);
    gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);
    osc.start(t2);
    osc.stop(t2 + 0.18);
  });

  // — Coin 3: landing clink —
  const t3 = startTime + 0.28;
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.type = "triangle";
  osc3.frequency.setValueAtTime(4698, t3); // D8
  gain3.gain.setValueAtTime(0.1, t3);
  gain3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.1);
  osc3.start(t3);
  osc3.stop(t3 + 0.1);

  // — Metallic shimmer (noise burst through bandpass) —
  const bufferSize = ctx.sampleRate * 0.15;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(6000, startTime);
  bandpass.Q.setValueAtTime(8, startTime);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(startTime);
  noise.stop(startTime + 0.15);

  // — Resonant "bag" thud —
  const t4 = startTime + 0.35;
  const oscBag = ctx.createOscillator();
  const gainBag = ctx.createGain();
  oscBag.connect(gainBag);
  gainBag.connect(ctx.destination);
  oscBag.type = "sine";
  oscBag.frequency.setValueAtTime(200, t4);
  oscBag.frequency.exponentialRampToValueAtTime(80, t4 + 0.15);
  gainBag.gain.setValueAtTime(0.12, t4);
  gainBag.gain.exponentialRampToValueAtTime(0.001, t4 + 0.15);
  oscBag.start(t4);
  oscBag.stop(t4 + 0.15);

  // — Rising chime (success feel) —
  const t5 = startTime + 0.45;
  const chimeFreqs = [1047, 1319, 1568]; // C6, E6, G6 major chord arpeggio
  chimeFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const t = t5 + i * 0.08;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/** Speak amount with a female voice using Web Speech API */
function speakAmount(amount: number) {
  try {
    if (!window.speechSynthesis) return;
    const text = `到账 ${amount.toFixed(2)} 美元`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    utterance.pitch = 1.3; // higher pitch for feminine voice

    // Try to find a Chinese female voice
    const voices = speechSynthesis.getVoices();
    const zhFemale = voices.find(
      (v) =>
        v.lang.startsWith("zh") &&
        (v.name.toLowerCase().includes("female") ||
          v.name.includes("Tingting") ||
          v.name.includes("Sinji") ||
          v.name.includes("Meijia") ||
          v.name.includes("Lili")),
    );
    const zhVoice = zhFemale || voices.find((v) => v.lang.startsWith("zh"));
    if (zhVoice) utterance.voice = zhVoice;

    speechSynthesis.speak(utterance);
  } catch {
    // speech not available
  }
}

/** Full payment notification: coin drop → voice announcement */
function playPaymentSound(amount: number) {
  try {
    const ctx = new AudioContext();
    playCoinDrop(ctx, ctx.currentTime);
    // Speak after coin sound finishes (~1s)
    setTimeout(() => {
      speakAmount(amount);
      setTimeout(() => ctx.close(), 500);
    }, 1000);
  } catch {
    // audio not available
  }
}

// ── Component ──────────────────────────────────────────────────
export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Preload voices (some browsers need this)
  useEffect(() => {
    speechSynthesis?.getVoices();
    const handleVoicesChanged = () => speechSynthesis?.getVoices();
    speechSynthesis?.addEventListener?.("voiceschanged", handleVoicesChanged);
    return () =>
      speechSynthesis?.removeEventListener?.(
        "voiceschanged",
        handleVoicesChanged,
      );
  }, []);

  // Build a unique key for deduplication
  const notifKey = (n: NotificationItem) => `${n.type}:${n.user_id}:${n.time}`;

  const handleNewNotifications = useCallback(
    (notifications: NotificationItem[]) => {
      // Filter out notifications older than the last clear time
      const clearedAt = localStorage.getItem(CLEARED_AT_KEY);
      const filtered = clearedAt
        ? notifications.filter((n) => new Date(n.time).getTime() > Number(clearedAt))
        : notifications;
      setItems(filtered);

      if (isFirstLoad.current) {
        // First load — populate known set, no sound
        filtered.forEach((n) => knownIdsRef.current.add(notifKey(n)));
        isFirstLoad.current = false;
        return;
      }

      if (!soundEnabled) return;

      // Detect new items
      let hasNewRegistration = false;
      let subAmount = 0;
      for (const n of filtered) {
        const key = notifKey(n);
        if (!knownIdsRef.current.has(key)) {
          knownIdsRef.current.add(key);
          if (n.type === "subscription") {
            subAmount += n.amount ?? 0;
            toast.success(`💰 ${n.message}`, { duration: 6000 });
          } else if (n.type === "registration") {
            hasNewRegistration = true;
            toast.info(`👤 ${n.message}`, { duration: 5000 });
          }
        }
      }

      // Play sounds (subscription takes priority)
      if (subAmount > 0) {
        playPaymentSound(subAmount);
      } else if (hasNewRegistration) {
        playDing();
      }
    },
    [soundEnabled],
  );

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
      .then((res) => handleNewNotifications(res.notifications))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
        .then((res) => handleNewNotifications(res.notifications))
        .catch(() => {});
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [handleNewNotifications]);

  const newCount = items.filter((n) => {
    const age = Date.now() - new Date(n.time).getTime();
    return age < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={soundEnabled ? "关闭提示音" : "开启提示音"}
        onClick={() => setSoundEnabled((v) => !v)}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {newCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {newCount > 9 ? "9+" : newCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h4 className="text-sm font-semibold">通知</h4>
            {items.length > 0 && (
              <button
                onClick={() => {
                  localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
                  setItems([]);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                清空
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                暂无通知
              </p>
            ) : (
              items.map((n, i) => (
                <Link
                  key={i}
                  href={`/users/${n.user_id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-0"
                >
                  {n.type === "registration" ? (
                    <UserPlus className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  ) : (
                    <CreditCard className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelative(n.time)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
