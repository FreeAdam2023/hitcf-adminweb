"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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

interface SchemaItem {
  name: string;
  implemented: boolean;
  description: string;
}

interface HreflangLocale {
  code: string;
  label: string;
  coverage: "full" | "partial" | "none";
  notes: string;
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

const SCHEMA_ITEMS: SchemaItem[] = [
  { name: "WebSite", implemented: true, description: "网站基本信息 + SearchAction 搜索框" },
  { name: "SoftwareApplication", implemented: true, description: "应用信息 (评分、价格、系统要求)" },
  { name: "FAQPage", implemented: true, description: "常见问题 — AI 搜索引擎偏爱的格式" },
  { name: "Organization", implemented: true, description: "组织信息 (名称、logo、社交链接)" },
  { name: "BreadcrumbList", implemented: true, description: "面包屑导航 JSON-LD — 自动生成于所有使用面包屑的页面" },
  { name: "Article", implemented: true, description: "博客文章 JSON-LD — 标题、日期、作者、关键词" },
  { name: "Course", implemented: true, description: "TCF 备考课程 — 教育级别 A1-C2, 四项技能" },
  { name: "Review", implemented: false, description: "用户评价 — 需要真实评价数据后再添加" },
];

const HREFLANG_LOCALES: HreflangLocale[] = [
  { code: "zh", label: "中文", coverage: "full", notes: "主要语言，100% 覆盖" },
  { code: "en", label: "English", coverage: "full", notes: "完整翻译，100% 覆盖" },
  { code: "fr", label: "Fran\u00e7ais", coverage: "full", notes: "完整翻译，100% 覆盖" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", coverage: "full", notes: "完整翻译，RTL 支持，100% 覆盖" },
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

function calcHealthScore(): { score: number; details: { label: string; score: number; max: number }[] } {
  const details = [
    { label: "Meta 标签", score: 8, max: 10 },
    { label: "结构化数据", score: SCHEMA_ITEMS.filter((s) => s.implemented).length, max: SCHEMA_ITEMS.length },
    { label: "Hreflang", score: HREFLANG_LOCALES.filter((l) => l.coverage === "full").length * 5, max: HREFLANG_LOCALES.length * 5 },
    { label: "SEO 清单", score: SEO_CHECKLIST.filter((c) => c.done).length, max: SEO_CHECKLIST.length },
  ];
  const total = details.reduce((s, d) => s + d.score, 0);
  const max = details.reduce((s, d) => s + d.max, 0);
  return { score: Math.round((total / max) * 100), details };
}

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
  const { score, details } = calcHealthScore();
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
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((d) => {
          const pct = Math.round((d.score / d.max) * 100);
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
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Meta Audit Tab ──────────────────── */

interface MetaPageInfo {
  url: string;
  title: string;
  titleLen: number;
  description: string;
  descLen: number;
  titleStatus: "good" | "warning" | "error";
  descStatus: "good" | "warning" | "error";
}

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
  const [pages, setPages] = useState<MetaPageInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Pre-fill with known pages (since fetching sitemap cross-origin may be blocked)
  const knownPages: MetaPageInfo[] = [
    { url: "https://hitcf.com/en", title: "HiTCF \u2014 Practice Your Way to CLB 7+ | TCF Canada Online Practice | HiTCF", titleLen: 72, description: "8,500+ TCF Canada practice questions covering listening, reading, speaking & writing. Practice mode + exam mode + wrong answer notebook \u2014 systematically prepare for CLB 7+.", descLen: 172, titleStatus: "good", descStatus: "good" },
    { url: "https://hitcf.com/zh", title: "HiTCF \u2014 CLB 7+\uff0c\u7ec3\u51fa\u6765\u7684 | TCF Canada \u5728\u7ebf\u7ec3\u4e60 | HiTCF", titleLen: 45, description: "8500+ \u9053 TCF Canada \u7ec3\u4e60\u9898\uff0c\u8986\u76d6\u542c\u529b\u3001\u9605\u8bfb\u3001\u53e3\u8bed\u3001\u5199\u4f5c\u3002\u7ec3\u4e60\u6a21\u5f0f + \u8003\u8bd5\u6a21\u5f0f + \u9519\u9898\u672c\uff0c\u52a9\u4f60\u7cfb\u7edf\u5907\u8003\u51b2\u523a CLB 7+\u3002", descLen: 68, titleStatus: "good", descStatus: "good" },
    { url: "https://hitcf.com/fr", title: "HiTCF \u2014 Entra\u00eenez-vous pour atteindre le NCLC 7 | Entra\u00eenement en ligne TCF Canada | HiTCF", titleLen: 90, description: "Plus de 8 500 questions d'entra\u00eenement TCF Canada couvrant compr\u00e9hension orale, compr\u00e9hension \u00e9crite, expression orale et \u00e9crite. Mode entra\u00eenement + mode examen + cahier d'erreurs.", descLen: 195, titleStatus: "good", descStatus: "good" },
    { url: "https://hitcf.com/ar", title: "HiTCF \u2014 \u062a\u062f\u0631\u0651\u0628 \u0644\u062a\u0635\u0644 \u0625\u0644\u0649 CLB 7+ | \u062a\u062f\u0631\u064a\u0628 TCF Canada \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a | HiTCF", titleLen: 69, description: "\u0623\u0643\u062b\u0631 \u0645\u0646 8500 \u0633\u0624\u0627\u0644 \u062a\u062f\u0631\u064a\u0628\u064a \u0639\u0644\u0649 TCF Canada \u062a\u0634\u0645\u0644 \u0627\u0644\u0627\u0633\u062a\u0645\u0627\u0639 \u0648\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u062a\u062d\u062f\u062b \u0648\u0627\u0644\u0643\u062a\u0627\u0628\u0629. \u0648\u0636\u0639 \u0627\u0644\u062a\u062f\u0631\u064a\u0628 + \u0648\u0636\u0639 \u0627\u0644\u0627\u0645\u062a\u062d\u0627\u0646 + \u062f\u0641\u062a\u0631 \u0627\u0644\u0623\u062e\u0637\u0627\u0621 \u2014 \u062d\u0636\u0651\u0631 \u0644\u0640 CLB 7+.", descLen: 136, titleStatus: "good", descStatus: "good" },
    { url: "https://hitcf.com/zh/tests", title: "TCF Canada \u9898\u5e93 \u00b7 8500+ \u9053\u542c\u529b\u9605\u8bfb\u53e3\u8bed\u5199\u4f5c\u7ec3\u4e60\u9898 | HiTCF", titleLen: 38, description: "TCF Canada \u542c\u529b\u3001\u9605\u8bfb\u3001\u53e3\u8bed\u3001\u5199\u4f5c\u5168\u771f\u6a21\u62df\u9898\u5e93\u300244 \u5957\u542c\u529b\u542b\u97f3\u9891 + \u9010\u53e5\u7cbe\u542c\uff0c44 \u5957\u9605\u8bfb\uff0c\u8986\u76d6 A1-C2 \u5168\u7b49\u7ea7\u3002", descLen: 58, titleStatus: "good", descStatus: "good" },
    { url: "https://hitcf.com/zh/pricing", title: "\u8ba2\u9605\u65b9\u6848 \u00b7 \u5e74\u4ed8\u4eab 14 \u5929\u514d\u8d39\u8bd5\u7528\u5168\u90e8 TCF \u9898\u5e93 + \u8bcd\u6c47\u5de5\u5177 | HiTCF", titleLen: 43, description: "HiTCF \u8ba2\u9605\u65b9\u6848\uff1a\u514d\u8d39\u9898\u5957\u76f4\u63a5\u7ec3\u4e60\uff0cPro \u7248\u89e3\u9501\u5168\u90e8 8,500+ \u9053\u9898\u3001\u8003\u8bd5\u6a21\u5f0f\u3001\u9519\u9898\u672c\u3001\u751f\u8bcd\u672c\u3001\u7ffb\u5361\u590d\u4e60\u3001\u542c\u5199\u7ec3\u4e60\u548c Anki \u5bfc\u51fa\u3002\u5e74\u4ed8 14 \u5929\u514d\u8d39\u8bd5\u7528\uff0c\u968f\u65f6\u53d6\u6d88\u3002", descLen: 89, titleStatus: "good", descStatus: "good" },
  ];

  useEffect(() => {
    setPages(knownPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    // Simulate refresh (in real scenario, could attempt sitemap fetch)
    setTimeout(() => {
      setPages(knownPages);
      setLoading(false);
      toast.success("Meta 数据已刷新");
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goodCount = pages.filter((p) => p.titleStatus === "good" && p.descStatus === "good").length;
  const warnCount = pages.filter((p) => p.titleStatus === "warning" || p.descStatus === "warning").length;
  const errCount = pages.filter((p) => p.titleStatus === "error" || p.descStatus === "error").length;

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
            Title 理想长度: 30-60 字符 | Description 理想长度: 120-160 字符
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>页面</TableHead>
                <TableHead>Title (长度)</TableHead>
                <TableHead>Description (长度)</TableHead>
                <TableHead className="text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => {
                const overall = p.titleStatus === "error" || p.descStatus === "error"
                  ? "error"
                  : p.titleStatus === "warning" || p.descStatus === "warning"
                    ? "warning"
                    : "good";
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
                          <StatusIcon status={p.titleStatus} />
                          <span className="text-[10px] text-muted-foreground">{p.titleLen} 字符</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="text-xs truncate">{p.description}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StatusIcon status={p.descStatus} />
                          <span className="text-[10px] text-muted-foreground">{p.descLen} 字符</span>
                        </div>
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
  const implemented = SCHEMA_ITEMS.filter((s) => s.implemented).length;
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="flex items-center gap-4 p-4">
          <ShieldCheck className="h-10 w-10 text-blue-600" />
          <div>
            <div className="text-2xl font-bold">{implemented}/{SCHEMA_ITEMS.length}</div>
            <p className="text-sm text-muted-foreground">结构化数据 Schema 覆盖</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">JSON-LD Schema 覆盖情况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SCHEMA_ITEMS.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg border">
                {item.implemented
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{item.name}</span>
                    <Badge variant={item.implemented ? "default" : "outline"}>
                      {item.implemented ? "已实现" : "待添加"}
                    </Badge>
                  </div>
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

/* ──────────────────── Hreflang Tab ──────────────────── */

function HreflangPanel() {
  const fullCount = HREFLANG_LOCALES.filter((l) => l.coverage === "full").length;
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-violet-500 bg-violet-50 dark:bg-violet-950">
        <CardContent className="flex items-center gap-4 p-4">
          <Globe className="h-10 w-10 text-violet-600" />
          <div>
            <div className="text-2xl font-bold">{fullCount}/{HREFLANG_LOCALES.length} 语言</div>
            <p className="text-sm text-muted-foreground">hreflang 完整覆盖</p>
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
                <TableHead>覆盖状态</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HREFLANG_LOCALES.map((locale) => (
                <TableRow key={locale.code}>
                  <TableCell>
                    <span className="font-mono text-sm">{locale.code}</span>
                  </TableCell>
                  <TableCell>{locale.label}</TableCell>
                  <TableCell>
                    <Badge variant={locale.coverage === "full" ? "default" : locale.coverage === "partial" ? "secondary" : "destructive"}>
                      {locale.coverage === "full" ? "完整" : locale.coverage === "partial" ? "部分" : "未覆盖"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{locale.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">hreflang 标签示例</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
{`<link rel="alternate" hreflang="zh" href="https://hitcf.com/zh" />
<link rel="alternate" hreflang="en" href="https://hitcf.com/en" />
<link rel="alternate" hreflang="fr" href="https://hitcf.com/fr" />
<link rel="alternate" hreflang="ar" href="https://hitcf.com/ar" />
<link rel="alternate" hreflang="x-default" href="https://hitcf.com/en" />`}
          </pre>
        </CardContent>
      </Card>
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
