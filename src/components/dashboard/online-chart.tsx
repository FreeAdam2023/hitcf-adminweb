"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOnlineHistory } from "@/lib/api/admin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

interface OnlinePoint {
  hour: string;
  count: number;
}

export function OnlineChart() {
  const [data, setData] = useState<OnlinePoint[]>([]);
  const [peak, setPeak] = useState(0);

  useEffect(() => {
    fetchOnlineHistory(24)
      .then((res) => {
        setData(res.data);
        setPeak(Math.max(0, ...res.data.map((d) => d.count)));
      })
      .catch(() => {});
  }, []);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-blue-600" />
          24h 在线趋势
          <span className="ml-auto text-2xl font-bold text-blue-600">
            峰值 {peak}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="onlineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(11, 16)}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number | undefined) => [
                value ?? 0,
                "活跃人数",
              ]}
              labelFormatter={(label) => {
                const d = new Date(String(label));
                return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#onlineGrad)"
              name="count"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
