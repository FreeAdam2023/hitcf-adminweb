"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRevenueHistory } from "@/lib/api/admin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign } from "lucide-react";

interface RevenuePoint {
  date: string;
  daily: number;
  cumulative: number;
}

export function RevenueChart() {
  const [data, setData] = useState<RevenuePoint[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchRevenueHistory()
      .then((res) => {
        setData(res.history);
        setTotal(res.total);
      })
      .catch(() => {});
  }, []);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          累计收入曲线
          <span className="ml-auto text-2xl font-bold text-emerald-600">
            ${total.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                `$${(value ?? 0).toFixed(2)}`,
                name === "cumulative" ? "累计" : "当日",
              ]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revGrad)"
              name="cumulative"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
