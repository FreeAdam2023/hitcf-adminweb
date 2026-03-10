"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileText } from "lucide-react";
import {
  fetchOpsAssets,
  createOpsAsset,
  updateOpsAsset,
  deleteOpsAsset,
} from "@/lib/api/admin";
import type { OpsAssetItem, PaginatedResponse } from "@/lib/api/types";

export function AssetLibrary() {
  const [data, setData] = useState<PaginatedResponse<OpsAssetItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetchOpsAssets({ search: search || undefined, tag: tagFilter || undefined })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [search, tagFilter, refreshKey]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<OpsAssetItem | null>(null);
  const [editTags, setEditTags] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTags, setNewTags] = useState("");

  const handleAdd = useCallback(async () => {
    if (!newFilename.trim() || !newUrl.trim()) return;
    const ext = newUrl.split(".").pop()?.toLowerCase() || "";
    await createOpsAsset({
      filename: newFilename.trim(),
      blob_url: newUrl.trim(),
      content_type: ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ? `image/${ext === "jpg" ? "jpeg" : ext}` : "application/octet-stream",
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setAddOpen(false);
    setNewFilename("");
    setNewUrl("");
    setNewTags("");
    refresh();
  }, [newFilename, newUrl, newTags]);

  const openDetail = (asset: OpsAssetItem) => {
    setSelectedAsset(asset);
    setEditTags(asset.tags.join(", "));
    setEditDesc(asset.description || "");
    setDetailOpen(true);
  };

  const handleUpdateAsset = useCallback(async () => {
    if (!selectedAsset) return;
    await updateOpsAsset(selectedAsset.id, {
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      description: editDesc.trim() || null,
    } as Partial<OpsAssetItem>);
    setDetailOpen(false);
    refresh();
  }, [selectedAsset, editTags, editDesc]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("确定删除？")) return;
    await deleteOpsAsset(id);
    setDetailOpen(false);
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="搜索文件名..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
        <Input placeholder="按标签筛选..." value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="w-40" />
        <Button className="ml-auto gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> 添加素材
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : !data?.items?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">暂无素材</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {data.items.map((asset: OpsAssetItem) => (
            <Card key={asset.id} className="overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => openDetail(asset)}>
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {asset.content_type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.blob_url} alt={asset.filename} className="object-cover w-full h-full" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{asset.filename}</p>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {asset.tags.slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add asset dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加素材</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium">文件名 *</label>
              <Input placeholder="cover-tcf-listening.png" value={newFilename} onChange={(e) => setNewFilename(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">URL *</label>
              <Input placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input placeholder="封面, 听力, 小红书" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={!newFilename.trim() || !newUrl.trim()} className="w-full">添加</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedAsset?.filename}</DialogTitle></DialogHeader>
          {selectedAsset && (
            <div className="space-y-3 pt-2">
              {selectedAsset.content_type.startsWith("image/") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedAsset.blob_url} alt={selectedAsset.filename} className="w-full rounded-lg border" />
              )}
              <div>
                <label className="text-sm font-medium">标签</label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="封面, 听力, 小红书" />
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="可选描述" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateAsset} className="flex-1">保存</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedAsset.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
