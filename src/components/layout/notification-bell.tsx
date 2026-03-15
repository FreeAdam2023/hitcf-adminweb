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

function playChaChing() {
  try {
    const ctx = new AudioContext();
    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1047, ctx.currentTime); // C6
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    // Second note (higher, delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1319, ctx.currentTime + 0.15); // E6
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 1000);
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

  // Build a unique key for deduplication
  const notifKey = (n: NotificationItem) => `${n.type}:${n.user_id}:${n.time}`;

  const handleNewNotifications = useCallback(
    (notifications: NotificationItem[]) => {
      setItems(notifications);

      if (isFirstLoad.current) {
        // First load — populate known set, no sound
        notifications.forEach((n) => knownIdsRef.current.add(notifKey(n)));
        isFirstLoad.current = false;
        return;
      }

      if (!soundEnabled) return;

      // Detect new items
      let hasNewRegistration = false;
      let hasNewSubscription = false;
      for (const n of notifications) {
        const key = notifKey(n);
        if (!knownIdsRef.current.has(key)) {
          knownIdsRef.current.add(key);
          if (n.type === "subscription") {
            hasNewSubscription = true;
            toast.success(`💰 ${n.message}`, { duration: 6000 });
          } else if (n.type === "registration") {
            hasNewRegistration = true;
            toast.info(`👤 ${n.message}`, { duration: 5000 });
          }
        }
      }

      // Play sounds (subscription takes priority)
      if (hasNewSubscription) {
        playChaChing();
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
                onClick={() => setItems([])}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                清空
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">暂无通知</p>
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
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(n.time)}</p>
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
