"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createTestSet, updateTestSet } from "@/lib/api/admin";
import type { AdminTestSetDetail } from "@/lib/api/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TestSetFormProps {
  initial?: AdminTestSetDetail;
}

export function TestSetForm({ initial }: TestSetFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "listening");
  const [questionCount, setQuestionCount] = useState(initial?.question_count ?? 0);
  const [timeLimit, setTimeLimit] = useState(initial?.time_limit_minutes ?? 40);
  const [isFree, setIsFree] = useState(initial?.is_free ?? false);
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [serieNumber, setSerieNumber] = useState<string>(initial?.serie_number?.toString() ?? "");
  const [sourceDate, setSourceDate] = useState(initial?.source_date ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Code is required";
    if (!name.trim()) errs.name = "Name is required";
    if (questionCount < 0) errs.question_count = "Must be >= 0";
    if (timeLimit < 0) errs.time_limit = "Must be >= 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        code,
        name,
        type,
        question_count: questionCount,
        time_limit_minutes: timeLimit,
        is_free: isFree,
        order,
      };
      if (serieNumber) data.serie_number = parseInt(serieNumber);
      if (sourceDate) data.source_date = sourceDate;

      if (isEdit) {
        await updateTestSet(initial.id, data);
        toast.success("Test set updated");
      } else {
        await createTestSet(data);
        toast.success("Test set created");
      }
      router.push("/test-sets");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save test set");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => { setCode(e.target.value); clearFieldError("code"); }}
            className={cn(errors.code && "border-destructive")}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="listening">listening</SelectItem>
              <SelectItem value="reading">reading</SelectItem>
              <SelectItem value="speaking">speaking</SelectItem>
              <SelectItem value="writing">writing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="question_count">Question Count</Label>
          <Input
            id="question_count"
            type="number"
            value={questionCount}
            onChange={(e) => { setQuestionCount(parseInt(e.target.value) || 0); clearFieldError("question_count"); }}
            className={cn(errors.question_count && "border-destructive")}
          />
          {errors.question_count && <p className="text-xs text-destructive">{errors.question_count}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time_limit">Time Limit (minutes)</Label>
          <Input
            id="time_limit"
            type="number"
            value={timeLimit}
            onChange={(e) => { setTimeLimit(parseInt(e.target.value) || 0); clearFieldError("time_limit"); }}
            className={cn(errors.time_limit && "border-destructive")}
          />
          {errors.time_limit && <p className="text-xs text-destructive">{errors.time_limit}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serie_number">Serie Number</Label>
          <Input
            id="serie_number"
            type="number"
            value={serieNumber}
            onChange={(e) => setSerieNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source_date">Source Date</Label>
          <Input
            id="source_date"
            value={sourceDate}
            onChange={(e) => setSourceDate(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_free"
          checked={isFree}
          onCheckedChange={(v) => setIsFree(v === true)}
        />
        <Label htmlFor="is_free">Free</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/test-sets")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
