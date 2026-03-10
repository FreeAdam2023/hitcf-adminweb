"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchOpsCalendar } from "@/lib/api/admin";
import type { OpsCalendarEntry } from "@/lib/api/types";

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function ContentCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<OpsCalendarEntry[]>([]);

  useEffect(() => {
    fetchOpsCalendar(year, month)
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]));
  }, [year, month]);

  const entriesByDate: Record<string, OpsCalendarEntry[]> = {};
  for (const e of entries) {
    const d = e.date.slice(0, 10);
    if (!entriesByDate[d]) entriesByDate[d] = [];
    entriesByDate[d].push(e);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold">{year} 年 {month} 月</span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div key={d} className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-card min-h-[80px]" />;
          }
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEntries = entriesByDate[dateStr] || [];
          const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

          return (
            <div key={dateStr} className="bg-card min-h-[80px] p-1.5">
              <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEntries.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${STATUS_COLORS[e.status] || STATUS_COLORS.draft}`}
                    title={`${e.title} ({{ draft: "草稿", scheduled: "已排期", published: "已发布" }[e.status] || e.status})`}
                  >
                    {e.title || e.topic}
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{dayEntries.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" /> 草稿
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" /> 已排期
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900" /> 已发布
        </div>
      </div>
    </div>
  );
}
