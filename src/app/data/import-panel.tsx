"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { fetchTestSets, previewImport, importQuestions } from "@/lib/api/admin";
import type { AdminTestSetItem, ImportPreviewResult } from "@/lib/api/types";
import { Upload, Eye } from "lucide-react";

export function ImportPanel() {
  const [testSets, setTestSets] = useState<AdminTestSetItem[]>([]);
  const [selectedTs, setSelectedTs] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchTestSets({ page_size: 200 }).then((res) => setTestSets(res.items));
  }, []);

  function parseJson(): Record<string, unknown>[] | null {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
      toast.error("JSON must be an array or object with 'questions' array");
      return null;
    } catch {
      toast.error("Invalid JSON");
      return null;
    }
  }

  async function handlePreview() {
    const questions = parseJson();
    if (!questions || !selectedTs) return;
    setLoading(true);
    try {
      const res = await previewImport({ test_set_id: selectedTs, questions });
      setPreview(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    const questions = parseJson();
    if (!questions || !selectedTs) return;
    setImporting(true);
    try {
      const res = await importQuestions({ test_set_id: selectedTs, questions });
      toast.success(res.message);
      setPreview(null);
      setJsonText("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <Label>Questions JSON</Label>
        <Textarea
          rows={12}
          placeholder='[{"question_number": 1, "type": "listening", "correct_answer": "A", "options": [{"key": "A", "text": "..."}]}]'
          value={jsonText}
          onChange={(e) => { setJsonText(e.target.value); setPreview(null); }}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={!selectedTs || !jsonText || loading}
        >
          <Eye className="mr-1 h-4 w-4" />
          {loading ? "Previewing..." : "Preview"}
        </Button>
        {preview && (
          <Button onClick={handleImport} disabled={importing}>
            <Upload className="mr-1 h-4 w-4" />
            {importing ? "Importing..." : "Import"}
          </Button>
        )}
      </div>

      {preview && (
        <Card>
          <CardHeader><CardTitle className="text-base">Preview: {preview.test_set_name}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-green-600">{preview.to_create}</span> to create
              </div>
              <div>
                <span className="font-medium text-blue-600">{preview.to_update}</span> to update
              </div>
              <div>
                <span className="font-medium text-red-600">{preview.conflicts}</span> conflicts
              </div>
            </div>
            {preview.details.conflict_details.length > 0 && (
              <div className="text-xs text-red-600 mt-2">
                {preview.details.conflict_details.map((c, i) => (
                  <div key={i}>{c.reason}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
