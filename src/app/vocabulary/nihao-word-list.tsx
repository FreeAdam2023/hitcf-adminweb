"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAdminNihaoWords, updateNihaoWord } from "@/lib/api/admin";
import type { AdminNihaoWordItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, Pencil, RotateCcw } from "lucide-react";

export function NihaoWordList() {
  const [data, setData] = useState<PaginatedResponse<AdminNihaoWordItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");

  // Edit dialog
  const [editWord, setEditWord] = useState<AdminNihaoWordItem | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminNihaoWords({
        level: level || undefined,
        page,
        page_size: 20,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nihao words");
    } finally {
      setLoading(false);
    }
  }, [level, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (w: AdminNihaoWordItem) => {
    setEditWord(w);
    setEditFields({
      display_form: w.display_form,
      meaning_zh: w.meaning_zh || "",
      meaning_en: w.meaning_en || "",
      part_of_speech: w.part_of_speech || "",
    });
  };

  const handleSave = async () => {
    if (!editWord) return;
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (editFields.display_form !== editWord.display_form)
        updates.display_form = editFields.display_form;
      if (editFields.meaning_zh !== (editWord.meaning_zh || ""))
        updates.meaning_zh = editFields.meaning_zh;
      if (editFields.meaning_en !== (editWord.meaning_en || ""))
        updates.meaning_en = editFields.meaning_en;
      if (editFields.part_of_speech !== (editWord.part_of_speech || ""))
        updates.part_of_speech = editFields.part_of_speech;

      if (Object.keys(updates).length === 0) {
        setEditWord(null);
        return;
      }

      await updateNihaoWord(editWord.id, updates);
      toast.success("Word updated");
      setEditWord(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const levelBadgeVariant = (l: string) => {
    switch (l) {
      case "A1":
        return "default" as const;
      case "A2":
        return "secondary" as const;
      case "B1":
        return "outline" as const;
      case "B2":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCcw className="mr-1 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={level || "all"}
          onValueChange={(v) => {
            setLevel(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="No nihao words found"
          description="Try adjusting your filter."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>POS</TableHead>
                <TableHead>Meaning (ZH)</TableHead>
                <TableHead>Meaning (EN)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    {w.display_form}
                  </TableCell>
                  <TableCell>
                    <Badge variant={levelBadgeVariant(w.level)}>
                      {w.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {w.lesson}
                    {w.lesson_title && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {w.lesson_title}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {w.part_of_speech || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm">
                    {w.meaning_zh || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm">
                    {w.meaning_en || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(w)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editWord} onOpenChange={() => setEditWord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit: {editWord?.display_form}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Display Form</Label>
              <Input
                value={editFields.display_form || ""}
                onChange={(e) =>
                  setEditFields((p) => ({
                    ...p,
                    display_form: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Meaning (Chinese)</Label>
              <Input
                value={editFields.meaning_zh || ""}
                onChange={(e) =>
                  setEditFields((p) => ({
                    ...p,
                    meaning_zh: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Meaning (English)</Label>
              <Input
                value={editFields.meaning_en || ""}
                onChange={(e) =>
                  setEditFields((p) => ({
                    ...p,
                    meaning_en: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Part of Speech</Label>
              <Input
                value={editFields.part_of_speech || ""}
                onChange={(e) =>
                  setEditFields((p) => ({
                    ...p,
                    part_of_speech: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditWord(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
