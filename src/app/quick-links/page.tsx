"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Mail,
  MailOpen,
  Cloud,
  Shield,
  Github,
  CreditCard,
  Database,
  Globe,
  Send,
  Server,
  BarChart3,
  FileText,
  ExternalLink,
} from "lucide-react";

interface QuickLink {
  label: string;
  href: string;
  description?: string;
  icon: React.ElementType;
}

interface LinkGroup {
  title: string;
  links: QuickLink[];
}

const linkGroups: LinkGroup[] = [
  {
    title: "邮件",
    links: [
      {
        label: "Zoho Inbox",
        href: "https://mail.zohocloud.ca/zm/#mail/folder/inbox",
        description: "收发 @hitcf.com 邮件",
        icon: MailOpen,
      },
      {
        label: "Zoho Mail Admin",
        href: "https://mail.zoho.com",
        description: "邮箱账号与域名管理",
        icon: Mail,
      },
      {
        label: "Zoho Admin Console",
        href: "https://www.zoho.com/mail/admin-console.html",
        description: "Zoho 后端管理控制台",
        icon: Mail,
      },
      {
        label: "Resend Dashboard",
        href: "https://resend.com/emails",
        description: "查看系统发送的邮件记录",
        icon: Send,
      },
    ],
  },
  {
    title: "托管与基础设施",
    links: [
      {
        label: "Azure Portal",
        href: "https://portal.azure.com/#browse/Microsoft.Web%2Fsites",
        description: "Web Apps、ACR、Storage 管理",
        icon: Cloud,
      },
      {
        label: "Cloudflare",
        href: "https://dash.cloudflare.com",
        description: "DNS、CDN、Access、邮件路由",
        icon: Shield,
      },
      {
        label: "MongoDB Atlas",
        href: "https://cloud.mongodb.com",
        description: "数据库集群管理",
        icon: Database,
      },
    ],
  },
  {
    title: "支付",
    links: [
      {
        label: "Stripe Dashboard",
        href: "https://dashboard.stripe.com",
        description: "订阅、支付、退款管理",
        icon: CreditCard,
      },
      {
        label: "Stripe Test Mode",
        href: "https://dashboard.stripe.com/test",
        description: "测试环境支付数据",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "代码与CI/CD",
    links: [
      {
        label: "hitcf-web",
        href: "https://github.com/FreeAdam2023/hitcf-web",
        description: "前端仓库",
        icon: Github,
      },
      {
        label: "hitcf-backend",
        href: "https://github.com/FreeAdam2023/hitcf-backend",
        description: "后端仓库",
        icon: Github,
      },
      {
        label: "hitcf-adminweb",
        href: "https://github.com/FreeAdam2023/hitcf-adminweb",
        description: "Admin 仓库",
        icon: Github,
      },
      {
        label: "GitHub Actions",
        href: "https://github.com/FreeAdam2023/hitcf-web/actions",
        description: "CI/CD 运行记录",
        icon: Server,
      },
    ],
  },
  {
    title: "监控与分析",
    links: [
      {
        label: "Health Monitor",
        href: "https://github.com/FreeAdam2023/hitcf-web/actions/workflows/health-monitor.yml",
        description: "每15分钟健康检查",
        icon: BarChart3,
      },
      {
        label: "Backend API Docs",
        href: "https://api.hitcf.com/docs",
        description: "Swagger / OpenAPI 文档",
        icon: FileText,
      },
      {
        label: "Backend API Docs (Dev)",
        href: "https://api-dev.hitcf.com/docs",
        description: "开发环境 API 文档",
        icon: FileText,
      },
    ],
  },
  {
    title: "站点",
    links: [
      {
        label: "hitcf.com (Prod)",
        href: "https://www.hitcf.com",
        description: "生产环境",
        icon: Globe,
      },
      {
        label: "dev.hitcf.com",
        href: "https://dev.hitcf.com",
        description: "开发环境",
        icon: Globe,
      },
      {
        label: "admin.hitcf.com",
        href: "https://admin.hitcf.com",
        description: "Admin 管理后台",
        icon: Globe,
      },
    ],
  },
];

export default function QuickLinksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="快捷链接"
        description="常用外部服务与工具快捷入口"
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {linkGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-lg border bg-card p-5"
          >
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
                >
                  <link.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium group-hover:text-foreground">
                        {link.label}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    {link.description && (
                      <p className="text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
