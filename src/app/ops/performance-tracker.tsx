"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, Bookmark, UserPlus, TrendingUp } from "lucide-react";
import { fetchOpsPerformanceSummary } from "@/lib/api/admin";
import type { OpsPerformanceSummary } from "@/lib/api/types";

export function PerformanceTracker() {
  const [data, setData] = useState<OpsPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpsPerformanceSummary()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>;

  if (!data || data.total_posts === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        暂无已发布的帖子数据。在「内容工作室」标记帖子为已发布并填写数据后，这里会显示汇总。
      </p>
    );
  }

  const stats = [
    { label: "发布帖数", value: data.total_posts, icon: TrendingUp, color: "text-blue-500" },
    { label: "总浏览", value: data.total_views.toLocaleString(), icon: Eye, color: "text-gray-500" },
    { label: "总点赞", value: data.total_likes.toLocaleString(), icon: Heart, color: "text-red-500" },
    { label: "总评论", value: data.total_comments.toLocaleString(), icon: MessageCircle, color: "text-amber-500" },
    { label: "总收藏", value: data.total_saves.toLocaleString(), icon: Bookmark, color: "text-purple-500" },
    { label: "引流注册", value: data.total_signups, icon: UserPlus, color: "text-green-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">互动率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{data.avg_engagement_rate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            (点赞 + 评论 + 收藏) / 浏览量
          </p>
        </CardContent>
      </Card>

      {data.best_post && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">最佳帖子</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{data.best_post.title}</div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{data.best_post.body}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              {data.best_post.performance && (
                <>
                  <span>浏览 {data.best_post.performance.views}</span>
                  <span>点赞 {data.best_post.performance.likes}</span>
                  <span>评论 {data.best_post.performance.comments}</span>
                  <span>收藏 {data.best_post.performance.saves}</span>
                </>
              )}
            </div>
            <div className="flex gap-1 mt-2">
              {data.best_post.hashtags.map((h: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px]">#{h.replace(/^#/, "")}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
