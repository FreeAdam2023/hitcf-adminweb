"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchCompetitors,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
} from "@/lib/api/admin";
import type { CompetitorItem, CompetitorFeature } from "@/lib/api/types";

const DEFAULT_FEATURES: CompetitorFeature[] = [
  { name: "Listening Practice", value: "", score: 0 },
  { name: "Reading Practice", value: "", score: 0 },
  { name: "Speaking Practice", value: "", score: 0 },
  { name: "Writing Practice", value: "", score: 0 },
  { name: "AI Explanations", value: "", score: 0 },
  { name: "Vocabulary Tools", value: "", score: 0 },
  { name: "Mock Exam Mode", value: "", score: 0 },
  { name: "Pronunciation", value: "", score: 0 },
  { name: "Mobile Support", value: "", score: 0 },
  { name: "Pricing", value: "", score: 0 },
  { name: "Free Tier", value: "", score: 0 },
  { name: "Multi-language", value: "", score: 0 },
];

interface FormData {
  name: string;
  url: string;
  description: string;
  tags: string;
  status: string;
  pricing_free: string;
  pricing_paid: string;
  notes: string;
  strengths: string;
  weaknesses: string;
  monitor_enabled: boolean;
  order: number;
  features: CompetitorFeature[];
}

const emptyForm: FormData = {
  name: "",
  url: "",
  description: "",
  tags: "",
  status: "active",
  pricing_free: "",
  pricing_paid: "",
  notes: "",
  strengths: "",
  weaknesses: "",
  monitor_enabled: false,
  order: 0,
  features: DEFAULT_FEATURES.map((f) => ({ ...f })),
};

function statusColor(s: string) {
  if (s === "active") return "default";
  if (s === "inactive") return "secondary";
  return "destructive";
}

export function CompetitorList() {
  const [items, setItems] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCompetitors({ search: search || undefined, page_size: 50 });
      setItems(res.items);
    } catch {
      toast.error("Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, features: DEFAULT_FEATURES.map((f) => ({ ...f })) });
    setDialogOpen(true);
  };

  const openEdit = (item: CompetitorItem) => {
    setEditingId(item.id);
    const features = DEFAULT_FEATURES.map((df) => {
      const existing = item.features.find((f) => f.name === df.name);
      return existing ? { ...existing } : { ...df };
    });
    // add any extra features from competitor not in defaults
    for (const f of item.features) {
      if (!features.find((x) => x.name === f.name)) {
        features.push({ ...f });
      }
    }
    setForm({
      name: item.name,
      url: item.url,
      description: item.description || "",
      tags: item.tags.join(", "),
      status: item.status,
      pricing_free: item.pricing_free || "",
      pricing_paid: item.pricing_paid || "",
      notes: item.notes || "",
      strengths: item.strengths || "",
      weaknesses: item.weaknesses || "",
      monitor_enabled: item.monitor_enabled,
      order: item.order,
      features,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.url) {
      toast.error("Name and URL are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        url: form.url,
        description: form.description || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: form.status,
        pricing_free: form.pricing_free || null,
        pricing_paid: form.pricing_paid || null,
        notes: form.notes || null,
        strengths: form.strengths || null,
        weaknesses: form.weaknesses || null,
        monitor_enabled: form.monitor_enabled,
        order: form.order,
        features: form.features.filter((f) => f.value.trim()),
      };
      if (editingId) {
        await updateCompetitor(editingId, payload);
        toast.success("Competitor updated");
      } else {
        await createCompetitor(payload);
        toast.success("Competitor created");
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCompetitor(deleteId);
      toast.success("Competitor deleted");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateFeature = (index: number, field: keyof CompetitorFeature, value: string | number) => {
    setForm((prev) => {
      const features = [...prev.features];
      features[index] = { ...features[index], [field]: value };
      return { ...prev, features };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search competitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Competitor
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No competitors yet. Click &quot;Add Competitor&quot; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <Badge variant={statusColor(item.status)}>{item.status}</Badge>
                      {item.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {item.url} <ExternalLink className="h-3 w-3" />
                    </a>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.pricing_paid && (
                    <span className="text-xs text-muted-foreground mr-2">{item.pricing_paid}</span>
                  )}
                  {item.last_check && (
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${item.last_check.is_up ? "bg-green-500" : "bg-red-500"}`} title={item.last_check.is_up ? "Online" : "Down"} />
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Strengths</h4>
                    <p className="text-muted-foreground">{item.strengths || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Weaknesses</h4>
                    <p className="text-muted-foreground">{item.weaknesses || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Free Tier</h4>
                    <p className="text-muted-foreground">{item.pricing_free || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-muted-foreground">{item.notes || "-"}</p>
                  </div>
                  {item.features.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {item.features.map((f) => (
                          <div key={f.name} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{f.name}:</span>
                            <span>{f.value}</span>
                            <span className="text-xs text-muted-foreground">({f.score}/5)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Competitor" : "Add Competitor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>URL *</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="TCF, TEF" />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="defunct">Defunct</option>
                </select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Free Tier</Label>
                <Input value={form.pricing_free} onChange={(e) => setForm({ ...form, pricing_free: e.target.value })} placeholder="e.g. 3 free tests" />
              </div>
              <div>
                <Label>Paid Plans</Label>
                <Input value={form.pricing_paid} onChange={(e) => setForm({ ...form, pricing_paid: e.target.value })} placeholder="e.g. $9.90-$49.90/mo" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Strengths</Label>
                <Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Weaknesses</Label>
                <Textarea value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} rows={2} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.monitor_enabled}
                onCheckedChange={(v) => setForm({ ...form, monitor_enabled: !!v })}
              />
              <Label className="cursor-pointer">Enable website monitoring</Label>
            </div>

            {/* Feature Scores */}
            <div>
              <Label className="mb-2 block">Feature Comparison (leave value empty to skip)</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {form.features.map((f, i) => (
                  <div key={f.name} className="grid grid-cols-[1fr_1.5fr_80px] gap-2 items-center">
                    <span className="text-sm">{f.name}</span>
                    <Input
                      value={f.value}
                      onChange={(e) => updateFeature(i, "value", e.target.value)}
                      placeholder="Description..."
                      className="h-8 text-sm"
                    />
                    <select
                      value={f.score}
                      onChange={(e) => updateFeature(i, "score", Number(e.target.value))}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}/5</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete competitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this competitor entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
