"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, UserPlus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchNotifications } from "@/lib/api/admin";
import type { NotificationItem } from "@/lib/api/types";

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

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then((res) => setItems(res.notifications))
      .catch(() => {});
  }, []);

  // Refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
        .then((res) => setItems(res.notifications))
        .catch(() => {});
    }, 120_000);
    return () => clearInterval(interval);
  }, []);

  const newCount = items.filter((n) => {
    const age = Date.now() - new Date(n.time).getTime();
    return age < 24 * 60 * 60 * 1000; // last 24h
  }).length;

  return (
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
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold">通知</h4>
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
  );
}
