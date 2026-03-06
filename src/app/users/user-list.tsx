"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchUsers, updateUserRole } from "@/lib/api/admin";
import type { AdminUserItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, RotateCcw, ChevronDown, Globe, Monitor, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function parseUA(ua: string | null): string {
  if (!ua) return "-";
  // Extract OS
  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  // Extract browser
  let browser = "";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  return browser ? `${browser} / ${os}` : os;
}

function formatLocation(t: { signup_country?: string | null; signup_city?: string | null; signup_region?: string | null } | null): string {
  if (!t) return "-";
  const parts = [t.signup_city, t.signup_region, t.signup_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
}

export function UserList() {
  const [data, setData] = useState<PaginatedResponse<AdminUserItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ search: search || undefined, page });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      toast.success("User role updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("zh-CN");
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by email..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="mr-1 h-3 w-3" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting your search terms." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((u) => (
                <>
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => toggleExpand(u.id)}
                  >
                    <TableCell>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          expandedId === u.id && "rotate-180",
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium"><Link href={`/users/${u.id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{u.email}</Link></TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                      >
                        <SelectTrigger
                          className="w-24 h-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">user</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.subscription_status === "active" ? "default" : "secondary"}>
                        {u.subscription_status || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>{formatDate(u.last_login_at)}</TableCell>
                  </TableRow>
                  {expandedId === u.id && (
                    <TableRow key={`${u.id}-detail`}>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <div className="space-y-3 px-4 py-3 text-sm">
                          {/* Row 1: Basic info */}
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                              <span className="text-xs text-muted-foreground">Subscription</span>
                              <p className="font-medium">{u.subscription_status || "None"}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Role</span>
                              <p className="font-medium capitalize">{u.role}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Created</span>
                              <p className="font-medium">{formatDateTime(u.created_at)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Last Login</span>
                              <p className="font-medium">{formatDateTime(u.last_login_at)}</p>
                            </div>
                          </div>
                          {/* Row 2: Tracking - Location & Device */}
                          <div className="border-t pt-3">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracking</p>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" /> Location
                                </span>
                                <p className="font-medium">{formatLocation(u.tracking)}</p>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Monitor className="h-3 w-3" /> Signup Device
                                </span>
                                <p className="font-medium">{parseUA(u.tracking?.signup_user_agent ?? null)}</p>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Link2 className="h-3 w-3" /> Source
                                </span>
                                <p className="font-medium">
                                  {u.tracking?.signup_utm_source || u.tracking?.signup_referer || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Monitor className="h-3 w-3" /> Last Login Device
                                </span>
                                <p className="font-medium">{parseUA(u.tracking?.last_login_user_agent ?? null)}</p>
                              </div>
                            </div>
                          </div>
                          {/* Row 3: IPs & UTM details (collapsible) */}
                          {u.tracking && (u.tracking.signup_ip || u.tracking.signup_utm_medium || u.tracking.signup_utm_campaign) && (
                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground md:grid-cols-4">
                              <div>
                                <span>Signup IP</span>
                                <p className="font-mono text-foreground">{u.tracking.signup_ip || "-"}</p>
                              </div>
                              <div>
                                <span>Last Login IP</span>
                                <p className="font-mono text-foreground">{u.tracking.last_login_ip || "-"}</p>
                              </div>
                              {u.tracking.signup_utm_medium && (
                                <div>
                                  <span>UTM Medium</span>
                                  <p className="text-foreground">{u.tracking.signup_utm_medium}</p>
                                </div>
                              )}
                              {u.tracking.signup_utm_campaign && (
                                <div>
                                  <span>UTM Campaign</span>
                                  <p className="text-foreground">{u.tracking.signup_utm_campaign}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
          <Pagination page={data.page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
