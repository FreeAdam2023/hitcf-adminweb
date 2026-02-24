"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAudioStatus, fetchMissingAudio, setAudioUrl } from "@/lib/api/admin";
import type { AudioStatus, MissingAudioItem, PaginatedResponse } from "@/lib/api/types";
import { Volume2, VolumeX, CheckCircle } from "lucide-react";

export function AudioPanel() {
  const [status, setStatus] = useState<AudioStatus | null>(null);
  const [missing, setMissing] = useState<PaginatedResponse<MissingAudioItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Set URL dialog
  const [urlDialog, setUrlDialog] = useState<MissingAudioItem | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        fetchAudioStatus(),
        fetchMissingAudio({ page }),
      ]);
      setStatus(s);
      setMissing(m);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load audio data");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleSetUrl() {
    if (!urlDialog || !urlInput.trim()) return;
    try {
      await setAudioUrl(urlDialog.question_id, urlInput.trim());
      toast.success("Audio URL updated");
      setUrlDialog(null);
      setUrlInput("");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to set audio URL");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {status && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listening</CardTitle>
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{status.total_listening}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Audio</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{status.with_audio}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Audio</CardTitle>
              <VolumeX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{status.without_audio}</div></CardContent>
          </Card>
        </div>
      )}

      {/* By Test Set */}
      {status && status.by_test_set.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Audio Coverage by Test Set</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.by_test_set.map((ts) => {
                const pct = ts.total > 0 ? Math.round((ts.with_audio / ts.total) * 100) : 0;
                return (
                  <div key={ts.test_set_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{ts.test_set_name}</span>
                      <span className="text-muted-foreground ml-2">{ts.with_audio}/{ts.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Audio List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Missing Audio</CardTitle></CardHeader>
        <CardContent>
          {!missing || missing.items.length === 0 ? (
            <EmptyState title="All listening questions have audio" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Set</TableHead>
                    <TableHead>Question #</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missing.items.map((item) => (
                    <TableRow key={item.question_id}>
                      <TableCell>{item.test_set_name}</TableCell>
                      <TableCell>{item.question_number}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setUrlDialog(item); setUrlInput(""); }}
                        >
                          Set URL
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={missing.total_pages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Set URL Dialog */}
      <Dialog open={!!urlDialog} onOpenChange={() => setUrlDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Audio URL</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {urlDialog?.test_set_name} - Q{urlDialog?.question_number}
          </p>
          <div className="space-y-2">
            <Label>Audio URL</Label>
            <Input
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialog(null)}>Cancel</Button>
            <Button onClick={handleSetUrl} disabled={!urlInput.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
