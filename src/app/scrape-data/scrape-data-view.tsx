"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchScrapeSources,
  fetchScrapeTests,
  fetchScrapePreview,
} from "@/lib/api/admin";
import type { ScrapeSource, ScrapeTest, ScrapePreview } from "@/lib/api/types";
import {
  AlertCircle,
  RotateCcw,
  Database,
  FileText,
  Headphones,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Music,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  preptcf: "PrepTCF Canada",
  opal: "OPAL",
  reussir: "Reussir",
};

// Known total test counts per source for progress calculation
const SOURCE_TOTALS: Record<string, { ce: number; co: number }> = {
  opal: { ce: 52, co: 53 },
  preptcf: { ce: 40, co: 40 },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function ScrapeDataView() {
  // Sources
  const [sources, setSources] = useState<ScrapeSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  // Selected source
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [testType, setTestType] = useState<string>("ce");

  // Tests
  const [tests, setTests] = useState<ScrapeTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Preview
  const [preview, setPreview] = useState<ScrapePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTestNum, setPreviewTestNum] = useState<number | null>(null);

  // Load sources
  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    setSourcesError(null);
    try {
      const res = await fetchScrapeSources();
      setSources(res.sources);
    } catch (err) {
      setSourcesError(err instanceof Error ? err.message : "加载数据源失败");
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Load tests when source or type changes
  const loadTests = useCallback(async () => {
    if (!selectedSource) return;
    setTestsLoading(true);
    setTestsError(null);
    setPreview(null);
    setPreviewTestNum(null);
    try {
      const res = await fetchScrapeTests(selectedSource, testType);
      setTests(res.tests);
    } catch (err) {
      setTestsError(err instanceof Error ? err.message : "加载测试列表失败");
    } finally {
      setTestsLoading(false);
    }
  }, [selectedSource, testType]);

  useEffect(() => {
    if (selectedSource) {
      loadTests();
    }
  }, [selectedSource, testType, loadTests]);

  // Load preview
  const loadPreview = useCallback(async (testNum: number) => {
    if (!selectedSource) return;
    if (previewTestNum === testNum) {
      // Toggle off
      setPreview(null);
      setPreviewTestNum(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewTestNum(testNum);
    try {
      const res = await fetchScrapePreview(selectedSource, testType, testNum);
      setPreview(res);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "加载预览失败");
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedSource, testType, previewTestNum]);

  const handleSelectSource = (source: string) => {
    if (selectedSource === source) {
      setSelectedSource(null);
      setTests([]);
      setPreview(null);
      setPreviewTestNum(null);
    } else {
      setSelectedSource(source);
      setTestType("ce");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Source cards */}
      {sourcesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : sourcesError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{sourcesError}</p>
          <Button variant="outline" size="sm" onClick={loadSources}>
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </div>
      ) : sources.length === 0 ? (
        <EmptyState title="暂无数据源" description="尚未配置任何外部数据源" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((src) => {
            const isActive = selectedSource === src.source;
            return (
              <Card
                key={src.source}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isActive && "ring-2 ring-primary",
                )}
                onClick={() => handleSelectSource(src.source)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {SOURCE_LABELS[src.source] || src.label}
                    </CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const totals = SOURCE_TOTALS[src.source];
                    const scraped = src.ce_count + src.co_count;
                    const total = totals ? totals.ce + totals.co : 0;
                    const pct = total > 0 ? Math.round((scraped / total) * 100) : 0;
                    return (
                      <div className="space-y-3">
                        {total > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">采集进度</span>
                              <span className="font-medium">{scraped}/{total} 套 ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            阅读 (CE)
                          </div>
                          <div className="font-medium text-right">
                            {src.ce_count}{totals ? `/${totals.ce}` : ""}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Headphones className="h-3.5 w-3.5" />
                            听力 (CO)
                          </div>
                          <div className="font-medium text-right">
                            {src.co_count}{totals ? `/${totals.co}` : ""}
                          </div>
                          <div className="text-muted-foreground">文件总数</div>
                          <div className="font-medium text-right">{src.total_files}</div>
                          <div className="text-muted-foreground">数据大小</div>
                          <div className="font-medium text-right">{formatSize(src.total_size)}</div>
                          <div className="text-muted-foreground">最近上传</div>
                          <div className="text-right text-xs">{formatDate(src.last_uploaded)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Section 2: Test list */}
      {selectedSource && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {SOURCE_LABELS[selectedSource] || selectedSource} - 测试列表
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedSource(null);
                setTests([]);
                setPreview(null);
                setPreviewTestNum(null);
              }}
            >
              <X className="mr-1 h-3 w-3" /> 关闭
            </Button>
          </div>

          <Tabs value={testType} onValueChange={(v) => { setTestType(v); setPreviewTestNum(null); setPreview(null); }}>
            <TabsList>
              <TabsTrigger value="ce">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                阅读 (CE)
              </TabsTrigger>
              <TabsTrigger value="co">
                <Headphones className="mr-1.5 h-3.5 w-3.5" />
                听力 (CO)
              </TabsTrigger>
            </TabsList>

            <TabsContent value={testType}>
              {testsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : testsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                  <p className="text-sm text-destructive mb-3">{testsError}</p>
                  <Button variant="outline" size="sm" onClick={loadTests}>
                    <RotateCcw className="mr-1 h-3 w-3" /> 重试
                  </Button>
                </div>
              ) : tests.length === 0 ? (
                <EmptyState title="暂无测试" description="该来源下没有此类型的测试数据" />
              ) : (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">测试编号</TableHead>
                        <TableHead className="text-right">文件数</TableHead>
                        <TableHead className="text-right">大小</TableHead>
                        <TableHead className="text-right">题目数</TableHead>
                        <TableHead>数据状态</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((t) => {
                        const isExpanded = previewTestNum === t.test_num;
                        return (
                          <TableRow
                            key={t.test_num}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isExpanded && "bg-muted/50",
                            )}
                            onClick={() => loadPreview(t.test_num)}
                          >
                            <TableCell className="font-medium">
                              Test {t.test_num}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {t.file_count}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {formatSize(t.total_size)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {t.question_count > 0 ? t.question_count : "-"}
                            </TableCell>
                            <TableCell>
                              {t.has_data_json ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  已解析
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  未解析
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Section 3: Preview panel (inline below table) */}
                  {previewTestNum !== null && (
                    <PreviewPanel
                      loading={previewLoading}
                      error={previewError}
                      preview={preview}
                      testNum={previewTestNum}
                      onRetry={() => loadPreview(previewTestNum)}
                      onClose={() => { setPreviewTestNum(null); setPreview(null); }}
                    />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ---------- Preview Panel ----------

function PreviewPanel({
  loading,
  error,
  preview,
  testNum,
  onRetry,
  onClose,
}: {
  loading: boolean;
  error: string | null;
  preview: ScrapePreview | null;
  testNum: number;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center pt-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center pt-6">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!preview || preview.questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState title="暂无题目" description={`Test ${testNum} 尚未解析出题目数据`} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Test {preview.test_num} 预览 - {preview.question_count} 题
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {preview.questions.map((q) => (
            <div
              key={q.question_number}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="font-medium text-muted-foreground">
                Q{q.question_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {q.options_count} 选项
              </span>
              {q.has_image && (
                <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
              )}
              {q.has_audio && (
                <Music className="h-3.5 w-3.5 text-purple-500" />
              )}
              {q.question_text && (
                <span className="ml-auto truncate text-xs text-muted-foreground max-w-[120px]" title={q.question_text}>
                  {q.question_text}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
