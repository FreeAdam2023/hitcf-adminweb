"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchVocabStats, fetchWordViewStats } from "@/lib/api/admin";
import type { VocabPoolStats, WordViewStats } from "@/lib/api/types";
import { AlertCircle, BookMarked, BookOpen, Eye, Users } from "lucide-react";

export function VocabDashboard() {
  const [stats, setStats] = useState<VocabPoolStats | null>(null);
  const [viewStats, setViewStats] = useState<WordViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [poolData, viewData] = await Promise.all([
        fetchVocabStats(),
        fetchWordViewStats(30),
      ]);
      setStats(poolData);
      setViewStats(viewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button className="mt-4" variant="outline" onClick={load}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pool Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              用户收藏单词
            </CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.saved_word_count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              来自 {stats.saved_word_user_count} 个用户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              你好法语词汇
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.nihao_word_count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              A1-B2 词汇库
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.saved_word_user_count}
            </div>
            <p className="text-xs text-muted-foreground">
              有收藏单词的用户
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Word View Stats */}
      {viewStats && viewStats.total_views > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  卡片查看次数 (30天)
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {viewStats.total_views.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {viewStats.unique_users} 个用户
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">按来源分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(viewStats.by_source_type).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key}</span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">按词库分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(viewStats.by_pool).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key}</span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Viewed Words */}
          {viewStats.top_viewed_words.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  热门查看单词 (30天)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {viewStats.top_viewed_words.map((w, i) => (
                    <div
                      key={w.word}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          #{i + 1}
                        </span>
                        <span className="font-medium">{w.word}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {w.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Top Saved Words */}
      {stats.top_saved_words.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              热门收藏单词
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {stats.top_saved_words.map((w, i) => (
                <div
                  key={w.word}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="font-medium">{w.word}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {w.count}x
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
