"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { fetchTestSets, exportTestSet, exportQuestions } from "@/lib/api/admin";
import type { AdminTestSetItem } from "@/lib/api/types";
import { Download } from "lucide-react";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const [testSets, setTestSets] = useState<AdminTestSetItem[]>([]);
  const [selectedTs, setSelectedTs] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTestSets({ page_size: 200 }).then((res) => setTestSets(res.items));
  }, []);

  async function handleExportTestSet() {
    if (!selectedTs) return;
    setExporting(true);
    try {
      const data = await exportTestSet(selectedTs);
      const ts = testSets.find((t) => t.id === selectedTs);
      downloadJson(data, `${ts?.code || "test-set"}.json`);
      toast.success("Export downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportQuestions() {
    setExporting(true);
    try {
      const data = await exportQuestions({
        test_set_id: selectedTs || undefined,
        type: selectedType !== "all" ? selectedType : undefined,
      });
      downloadJson(data, "questions_export.json");
      toast.success("Export downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Export Test Set</h3>
        <div className="flex gap-3 items-end">
          <div className="space-y-2 flex-1 max-w-sm">
            <Label>Test Set</Label>
            <Select value={selectedTs} onValueChange={setSelectedTs}>
              <SelectTrigger><SelectValue placeholder="Select test set" /></SelectTrigger>
              <SelectContent>
                {testSets.map((ts) => (
                  <SelectItem key={ts.id} value={ts.id}>{ts.code} - {ts.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportTestSet} disabled={!selectedTs || exporting}>
            <Download className="mr-1 h-4 w-4" />
            Export Test Set
          </Button>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="font-medium">Export Questions by Filter</h3>
        <div className="flex gap-3 items-end">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportQuestions} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" />
            Export Questions
          </Button>
        </div>
      </div>
    </div>
  );
}
