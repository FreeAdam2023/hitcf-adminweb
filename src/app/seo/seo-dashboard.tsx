"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  ShieldCheck,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchSeoAudit } from "@/lib/api/admin";
import type { SeoAuditResponse } from "@/lib/api/types";

/* ──────────────────── Types ──────────────────── */

interface KeywordEntry {
  id: string;
  keyword: string;
  targetPage: string;
  position: string;
  notes: string;
}

interface SeoCheckItem {
  label: string;
  done: boolean;
  description: string;
}

/* ──────────────────── Shared audit context ──────────────────── */

interface AuditCtx {
  data: SeoAuditResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AuditContext = createContext<AuditCtx>({
  data: null,
  loading: false,
  error: null,
  refresh: () => {},
});

function useAudit() {
  return useContext(AuditContext);
}

/* ──────────────────── Constants ──────────────────── */

const SEO_CHECKLIST: SeoCheckItem[] = [
  { label: "Sitemap 已提交", done: true, description: "sitemap.xml 已提交至 Google Search Console 和 Bing Webmaster" },
  { label: "Robots.txt 正确配置", done: true, description: "允许所有爬虫，指向 sitemap.xml" },
  { label: "Google Search Console 已接入", done: true, description: "已验证域名所有权，可查看索引数据" },
  { label: "Bing Webmaster 已接入", done: true, description: "已验证域名，可查看 Bing 搜索数据" },
  { label: "Open Graph 图片", done: true, description: "首页和主要页面已设置 OG 图片" },
  { label: "结构化数据", done: true, description: "WebSite, SoftwareApplication, FAQPage, Organization schema 已添加" },
  { label: "Canonical URL", done: true, description: "所有页面设置了 canonical URL，避免重复内容" },
  { label: "hreflang 标签", done: true, description: "4 种语言 (zh/en/fr/ar) 的 hreflang 标签已添加" },
  { label: "Google Analytics", done: true, description: "GA4 已接入 (G-DTDE8V6XLH)，支持自定义事件追踪" },
  { label: "BreadcrumbList schema", done: true, description: "面包屑 JSON-LD 结构化数据已添加至所有导航页面" },
  { label: "每页独立 OG 图片", done: true, description: "动态 OG 图片已通过 opengraph-image.tsx 生成" },
];

const KNOWN_SCHEMAS = [
  { name: "WebSite", description: "网站基本信息 + SearchAction 搜索框" },
  { name: "SoftwareApplication", description: "应用信息 (评分、价格、系统要求)" },
  { name: "FAQPage", description: "常见问题 — AI 搜索引擎偏爱的格式" },
  { name: "Organization", description: "组织信息 (名称、logo、社交链接)" },
  { name: "BreadcrumbList", description: "面包屑导航 JSON-LD" },
  { name: "Article", description: "博客文章 JSON-LD — 标题、日期、作者" },
  { name: "Course", description: "TCF 备考课程 — 教育级别 A1-C2" },
  { name: "Review", description: "真实用户评价 + AggregateRating" },
];

const DEFAULT_KEYWORDS: KeywordEntry[] = [
  { id: "1", keyword: "tcf canada practice", targetPage: "https://hitcf.com", position: "", notes: "核心关键词" },
  { id: "2", keyword: "clb 7 preparation", targetPage: "https://hitcf.com", position: "", notes: "移民目标分数" },
  { id: "3", keyword: "tcf listening", targetPage: "https://hitcf.com/zh/tests", position: "", notes: "听力练习" },
  { id: "4", keyword: "nclc tcf canada", targetPage: "https://hitcf.com", position: "", notes: "法语移民关键词" },
  { id: "5", keyword: "hitcf", targetPage: "https://hitcf.com", position: "", notes: "品牌词" },
];

const STORAGE_KEY_KEYWORDS = "hitcf-admin-seo-keywords";

/* ──────────────────── Helpers ──────────────────── */

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 dark:bg-green-950 border-l-green-500";
  if (score >= 60) return "bg-amber-50 dark:bg-amber-950 border-l-amber-500";
  return "bg-red-50 dark:bg-red-950 border-l-red-500";
}

/* ──────────────────── Health Tab ──────────────────── */

function HealthPanel() {
  const { data, loading } = useAudit();

  const liveSchemas = data?.schema_summary ?? [];
  const liveHreflangs = data?.hreflang_summary ?? [];
  const pages = data?.pages ?? [];

  // Meta score: ratio of pages with good title + desc
  const metaGood = pages.filter((p) => p.title_status === "good" && p.desc_status === "good").length;
  const metaMax = Math.max(pages.length, 1);
  const metaScore = Math.round((metaGood / metaMax) * 10);

  // Schema score: how many known schemas are found
  const schemaFound = KNOWN_SCHEMAS.filter((s) => liveSchemas.includes(s.name)).length;
  const schemaMax = KNOWN_SCHEMAS.length;

  // Hreflang score: 5 per language
  const hreflangScore = liveHreflangs.length * 5;
  const hreflangMax = 4 * 5; // 4 expected languages

  // Checklist score
  const checkDone = SEO_CHECKLIST.filter((c) => c.done).length;
  const checkMax = SEO_CHECKLIST.length;

  const details = [
    { label: "Meta 标签", score: metaScore, max: 10 },
    { label: "结构化数据", score: schemaFound, max: schemaMax },
    { label: "Hreflang", score: hreflangScore, max: hreflangMax },
    { label: "SEO 清单", score: checkDone, max: checkMax },
  ];
  const total = details.reduce((s, d) => s + d.score, 0);
  const max = details.reduce((s, d) => s + d.max, 0);
  const score = max > 0 ? Math.round((total / max) * 100) : 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className={`border-l-4 ${getScoreBg(score)}`}>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-current">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">SEO 健康评分</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {score >= 80
                ? "网站 SEO 状态良好，继续保持并优化细节"
                : score >= 60
                  ? "SEO 基础不错，但仍有改善空间"
                  : "SEO 需要较多改善，请参考下方清单"}
            </p>
            {data && (
              <p className="text-xs text-muted-foreground mt-2">
                基于 {data.total_pages} 个页面的实时审计数据
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((d) => {
          const pct = d.max > 0 ? Math.round((d.score / d.max) * 100) : 0;
          return (
            <Card key={d.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{d.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${getScoreColor(pct)}`}>{d.score}/{d.max}</span>
                  <Badge variant={pct >= 80 ? "default" : pct >= 60 ? "secondary" : "destructive"}>
                    {pct}%
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            优先改善建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {SEO_CHECKLIST.filter((c) => !c.done).map((c) => (
              <li key={c.label} className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground"> — {c.description}</span>
                </div>
              </li>
            ))}
            {SEO_CHECKLIST.every((c) => c.done) && (
              <li className="flex items-start gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>SEO 清单已全部完成</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Meta Audit Tab ──────────────────── */

function StatusIcon({ status }: { status: "good" | "warning" | "error" }) {
  if (status === "good") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function StatusBadge({ status }: { status: "good" | "warning" | "error" }) {
  const map = { good: "default", warning: "secondary", error: "destructive" } as const;
  const labels = { good: "Good", warning: "Warning", error: "Error" };
  return <Badge variant={map[status]}>{labels[status]}</Badge>;
}

function MetaAuditPanel() {
  const { data, loading, refresh } = useAudit();
  const pages = data?.pages ?? [];

  const goodCount = data?.good_count ?? 0;
  const warnCount = data?.warning_count ?? 0;
  const errCount = pages.filter((p) => !!p.error).length;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{goodCount}</div>
              <p className="text-xs text-muted-foreground">状态良好</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">{warnCount}</div>
              <p className="text-xs text-muted-foreground">需要优化</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{errCount}</div>
              <p className="text-xs text-muted-foreground">存在问题</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">页面 Meta 标签审计</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Title 理想长度: 30-60 字符 | Description 理想长度: 120-160 字符 | 数据来自实时爬取
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>页面</TableHead>
                <TableHead>Title (长度)</TableHead>
                <TableHead>Description (长度)</TableHead>
                <TableHead>Schemas</TableHead>
                <TableHead className="text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => {
                if (p.error) {
                  return (
                    <TableRow key={p.url}>
                      <TableCell>
                        <span className="text-xs font-mono text-red-600">{p.url.replace("https://hitcf.com", "") || "/"}</span>
                      </TableCell>
                      <TableCell colSpan={3} className="text-xs text-red-500">{p.error}</TableCell>
                      <TableCell className="text-center"><StatusBadge status="error" /></TableCell>
                    </TableRow>
                  );
                }
                const titleStatus = p.title_status ?? "warning";
                const descStatus = p.desc_status ?? "warning";
                const overall = titleStatus === "warning" || descStatus === "warning" ? "warning" : "good";
                return (
                  <TableRow key={p.url}>
                    <TableCell>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-mono"
                      >
                        {p.url.replace("https://hitcf.com", "") || "/"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-xs truncate">{p.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StatusIcon status={titleStatus} />
                          <span className="text-[10px] text-muted-foreground">{p.title_len} 字符</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="text-xs truncate">{p.description}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StatusIcon status={descStatus} />
                          <span className="text-[10px] text-muted-foreground">{p.desc_len} 字符</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.schemas ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={overall} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Schema Tab ──────────────────── */

function SchemaPanel() {
  const { data, loading } = useAudit();
  const liveSchemas = data?.schema_summary ?? [];

  // Merge known schemas with live data
  const schemaItems = KNOWN_SCHEMAS.map((s) => ({
    ...s,
    implemented: liveSchemas.includes(s.name),
  }));
  // Add any unexpected schemas from live crawl
  const extra = liveSchemas.filter((s) => !KNOWN_SCHEMAS.some((k) => k.name === s));
  for (const name of extra) {
    schemaItems.push({ name, description: "在爬取中发现的额外 Schema", implemented: true });
  }

  const implemented = schemaItems.filter((s) => s.implemented).length;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="flex items-center gap-4 p-4">
          <ShieldCheck className="h-10 w-10 text-blue-600" />
          <div>
            <div className="text-2xl font-bold">{implemented}/{schemaItems.length}</div>
            <p className="text-sm text-muted-foreground">结构化数据 Schema 覆盖（实时检测）</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">JSON-LD Schema 覆盖情况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schemaItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg border">
                {item.implemented
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{item.name}</span>
                    <Badge variant={item.implemented ? "default" : "outline"}>
                      {item.implemented ? "已检测到" : "未检测到"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-page schema breakdown */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">各页面 Schema 分布</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>页面</TableHead>
                  <TableHead>检测到的 Schemas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pages.filter((p) => !p.error).map((p) => (
                  <TableRow key={p.url}>
                    <TableCell className="text-xs font-mono">{p.url.replace("https://hitcf.com", "") || "/"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.schemas ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                        {(p.schemas ?? []).length === 0 && (
                          <span className="text-xs text-muted-foreground">无</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────── Hreflang Tab ──────────────────── */

function HreflangPanel() {
  const { data, loading } = useAudit();
  const liveHreflangs = data?.hreflang_summary ?? [];

  const EXPECTED = [
    { code: "zh", label: "中文" },
    { code: "en", label: "English" },
    { code: "fr", label: "Fran\u00e7ais" },
    { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
    { code: "x-default", label: "x-default" },
  ];

  const locales = EXPECTED.map((e) => ({
    ...e,
    found: liveHreflangs.includes(e.code),
  }));
  const foundCount = locales.filter((l) => l.found).length;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-violet-500 bg-violet-50 dark:bg-violet-950">
        <CardContent className="flex items-center gap-4 p-4">
          <Globe className="h-10 w-10 text-violet-600" />
          <div>
            <div className="text-2xl font-bold">{foundCount}/{EXPECTED.length} 语言</div>
            <p className="text-sm text-muted-foreground">hreflang 覆盖（实时检测）</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">多语言 hreflang 状态</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>语言代码</TableHead>
                <TableHead>语言名称</TableHead>
                <TableHead>检测状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locales.map((locale) => (
                <TableRow key={locale.code}>
                  <TableCell>
                    <span className="font-mono text-sm">{locale.code}</span>
                  </TableCell>
                  <TableCell>{locale.label}</TableCell>
                  <TableCell>
                    <Badge variant={locale.found ? "default" : "destructive"}>
                      {locale.found ? "已检测到" : "未检测到"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-page hreflang breakdown */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">各页面 hreflang 标签</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>页面</TableHead>
                  <TableHead>hreflang 标签</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pages.filter((p) => !p.error).map((p) => (
                  <TableRow key={p.url}>
                    <TableCell className="text-xs font-mono">{p.url.replace("https://hitcf.com", "") || "/"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.hreflangs ?? []).map((h) => (
                          <Badge key={h.lang} variant="outline" className="text-[10px] px-1.5 py-0">
                            {h.lang}
                          </Badge>
                        ))}
                        {(p.hreflangs ?? []).length === 0 && (
                          <span className="text-xs text-muted-foreground">无</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────── Checklist Tab ──────────────────── */

function ChecklistPanel() {
  const doneCount = SEO_CHECKLIST.filter((c) => c.done).length;
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950">
        <CardContent className="flex items-center gap-4 p-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <div>
            <div className="text-2xl font-bold">{doneCount}/{SEO_CHECKLIST.length}</div>
            <p className="text-sm text-muted-foreground">SEO 清单完成度</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">SEO 优化清单</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SEO_CHECKLIST.map((item) => (
              <div
                key={item.label}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  item.done ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"
                }`}
              >
                {item.done
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  : <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />}
                <div>
                  <span className={`text-sm font-medium ${item.done ? "" : "text-red-700 dark:text-red-400"}`}>
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Keywords Tab ──────────────────── */

function KeywordsPanel() {
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_KEYWORDS);
    if (stored) {
      try {
        setKeywords(JSON.parse(stored));
      } catch {
        setKeywords(DEFAULT_KEYWORDS);
      }
    } else {
      setKeywords(DEFAULT_KEYWORDS);
    }
  }, []);

  const save = useCallback((updated: KeywordEntry[]) => {
    setKeywords(updated);
    localStorage.setItem(STORAGE_KEY_KEYWORDS, JSON.stringify(updated));
  }, []);

  const handleChange = (id: string, field: keyof KeywordEntry, value: string) => {
    const updated = keywords.map((k) => (k.id === id ? { ...k, [field]: value } : k));
    save(updated);
  };

  const addKeyword = () => {
    const newEntry: KeywordEntry = {
      id: Date.now().toString(),
      keyword: "",
      targetPage: "https://hitcf.com",
      position: "",
      notes: "",
    };
    save([...keywords, newEntry]);
  };

  const removeKeyword = (id: string) => {
    save(keywords.filter((k) => k.id !== id));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_KEYWORDS, JSON.stringify(keywords));
    toast.success("关键词数据已保存");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">关键词追踪</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addKeyword}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              添加关键词
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            手动追踪目标关键词在搜索引擎中的排名。数据存储在本地浏览器。
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>关键词</TableHead>
                <TableHead>目标页面</TableHead>
                <TableHead>当前排名</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell>
                    <Input
                      value={kw.keyword}
                      onChange={(e) => handleChange(kw.id, "keyword", e.target.value)}
                      placeholder="关键词"
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={kw.targetPage}
                      onChange={(e) => handleChange(kw.id, "targetPage", e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={kw.position}
                      onChange={(e) => handleChange(kw.id, "position", e.target.value)}
                      placeholder="排名"
                      className="h-8 w-20 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={kw.notes}
                      onChange={(e) => handleChange(kw.id, "notes", e.target.value)}
                      placeholder="备注"
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeKeyword(kw.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {keywords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    暂无关键词，点击 &quot;添加关键词&quot; 开始追踪
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Google Search Console Link */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">查看更多排名数据</p>
            <p className="text-xs text-muted-foreground">Google Search Console 提供完整的搜索查询数据</p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://search.google.com/search-console?resource_id=sc-domain%3Ahitcf.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Google Search Console
              </Button>
            </a>
            <a
              href="https://www.bing.com/webmasters?siteUrl=https%3A%2F%2Fhitcf.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Bing Webmaster
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Main Export ──────────────────── */

interface SeoDashboardProps {
  tab: "health" | "meta" | "schema" | "hreflang" | "checklist" | "keywords";
}

export function SeoDashboard({ tab }: SeoDashboardProps) {
  const [data, setData] = useState<SeoAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSeoAudit();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载失败";
      setError(msg);
      toast.error(`SEO 审计加载失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-fetch on mount for tabs that need live data
    if (["health", "meta", "schema", "hreflang"].includes(tab)) {
      load();
    }
  }, [tab, load]);

  const ctx: AuditCtx = { data, loading, error, refresh: load };

  return (
    <AuditContext.Provider value={ctx}>
      {renderTab(tab)}
    </AuditContext.Provider>
  );
}

function renderTab(tab: string) {
  switch (tab) {
    case "health":
      return <HealthPanel />;
    case "meta":
      return <MetaAuditPanel />;
    case "schema":
      return <SchemaPanel />;
    case "hreflang":
      return <HreflangPanel />;
    case "checklist":
      return <ChecklistPanel />;
    case "keywords":
      return <KeywordsPanel />;
    default:
      return null;
  }
}
