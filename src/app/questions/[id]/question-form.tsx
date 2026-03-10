"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createQuestion, updateQuestion, fetchTestSets, generateExplanation, deleteExplanation } from "@/lib/api/admin";
import type { AdminQuestionDetail, AdminTestSetItem, OptionInput } from "@/lib/api/types";
import { Plus, X, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  initial?: AdminQuestionDetail;
  defaultTestSetId?: string;
}

export function QuestionForm({ initial, defaultTestSetId }: QuestionFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [testSetId, setTestSetId] = useState(initial?.test_set_id ?? defaultTestSetId ?? "");
  const [type, setType] = useState(initial?.type ?? "listening");
  const [questionNumber, setQuestionNumber] = useState(initial?.question_number ?? 1);
  const [level, setLevel] = useState(initial?.level ?? "");
  const [questionText, setQuestionText] = useState(initial?.question_text ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");
  const [transcript, setTranscript] = useState(initial?.transcript ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audio_url ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correct_answer ?? "");
  const [options, setOptions] = useState<OptionInput[]>(initial?.options ?? []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [explanation, setExplanation] = useState(initial?.explanation ?? null);

  // Load test sets for the dropdown
  const [testSets, setTestSets] = useState<AdminTestSetItem[]>([]);
  useEffect(() => {
    fetchTestSets({ page_size: 200 }).then((res) => setTestSets(res.items));
  }, []);

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
    if (!isEdit && !testSetId) errs.test_set_id = "题库不能为空";
    if (questionNumber < 1) errs.question_number = "必须 ≥ 1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length); // A, B, C, D...
    setOptions([...options, { key: nextKey, text: "" }]);
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: keyof OptionInput, value: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: value };
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        type,
        question_number: questionNumber,
        options: options.filter((o) => o.text.trim()),
      };
      if (level) data.level = level;
      if (questionText) data.question_text = questionText;
      if (passage) data.passage = passage;
      if (transcript) data.transcript = transcript;
      if (audioUrl) data.audio_url = audioUrl;
      if (correctAnswer) data.correct_answer = correctAnswer;

      if (isEdit) {
        await updateQuestion(initial.id, data);
        toast.success("题目已更新");
      } else {
        data.test_set_id = testSetId;
        await createQuestion(data);
        toast.success("题目已创建");
      }
      router.push(testSetId ? `/questions?test_set_id=${testSetId}` : "/questions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存题目失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Set */}
        <div className="space-y-2">
          <Label>题库</Label>
          <Select
            value={testSetId}
            onValueChange={(v) => { setTestSetId(v); clearFieldError("test_set_id"); }}
            disabled={isEdit}
          >
            <SelectTrigger className={cn(errors.test_set_id && "border-destructive")}>
              <SelectValue placeholder="选择题库" />
            </SelectTrigger>
            <SelectContent>
              {testSets.map((ts) => (
                <SelectItem key={ts.id} value={ts.id}>{ts.code} — {ts.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.test_set_id && <p className="text-xs text-destructive">{errors.test_set_id}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>类型</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="listening">听力</SelectItem>
                <SelectItem value="reading">阅读</SelectItem>
                <SelectItem value="speaking">口语</SelectItem>
                <SelectItem value="writing">写作</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qnum">题号</Label>
            <Input
              id="qnum"
              type="number"
              value={questionNumber}
              onChange={(e) => { setQuestionNumber(parseInt(e.target.value) || 1); clearFieldError("question_number"); }}
              min={1}
              className={cn(errors.question_number && "border-destructive")}
            />
            {errors.question_number && <p className="text-xs text-destructive">{errors.question_number}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">级别</Label>
            <Input
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g. A2, B1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question_text">题目文本</Label>
          <Textarea
            id="question_text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passage">阅读文段</Label>
          <Textarea
            id="passage"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcript">听力原文</Label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="audio_url">音频链接</Label>
            <Input
              id="audio_url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correct_answer">正确答案</Label>
            <Input
              id="correct_answer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g. A"
            />
          </div>
        </div>

        {/* Dynamic Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>选项</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-1 h-3 w-3" /> 添加选项
            </Button>
          </div>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={opt.key}
                onChange={(e) => updateOption(idx, "key", e.target.value)}
                className="w-16"
                placeholder="键"
              />
              <Input
                value={opt.text}
                onChange={(e) => updateOption(idx, "text", e.target.value)}
                className="flex-1"
                placeholder="选项文本"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || (!isEdit && !testSetId)}>
            {saving ? "保存中..." : isEdit ? "保存" : "创建"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/questions")}>
            取消
          </Button>
        </div>
      </form>

      {/* Explanation */}
      {isEdit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">解析</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await generateExplanation(initial.id);
                    toast.success("解析已生成");
                    // Reload page to see new explanation
                    window.location.reload();
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : "生成失败");
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {generating ? "生成中..." : "生成"}
              </Button>
              {explanation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("删除此解析？")) return;
                    try {
                      await deleteExplanation(initial.id);
                      toast.success("解析已删除");
                      setExplanation(null);
                    } catch (e: unknown) {
                      toast.error(e instanceof Error ? e.message : "删除解析失败");
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  删除
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {explanation ? (
              <div className="space-y-3 text-sm">
                {explanation.status && (
                  <div>
                    <span className="font-medium">状态:</span>{" "}
                    <span className="capitalize">{explanation.status}</span>
                    {explanation.generated_by && (
                      <span className="text-muted-foreground"> (由 {explanation.generated_by} 生成)</span>
                    )}
                  </div>
                )}
                {explanation.correct_reasoning && (
                  <div>
                    <span className="font-medium">正确推理:</span>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{explanation.correct_reasoning}</p>
                  </div>
                )}
                {explanation.exam_skill && (
                  <div>
                    <span className="font-medium">考试技能:</span>{" "}
                    <span className="text-muted-foreground">{explanation.exam_skill}</span>
                  </div>
                )}
                {explanation.trap_pattern && (
                  <div>
                    <span className="font-medium">陷阱类型:</span>{" "}
                    <span className="text-muted-foreground">{explanation.trap_pattern}</span>
                  </div>
                )}
                {explanation.similar_tip && (
                  <div>
                    <span className="font-medium">同类技巧:</span>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{explanation.similar_tip}</p>
                  </div>
                )}
                {explanation.distractors && Object.keys(explanation.distractors).length > 0 && (
                  <div>
                    <span className="font-medium">干扰项:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(explanation.distractors).map(([key, d]) => (
                        <div key={key} className="text-muted-foreground">
                          <span className="font-mono">{key}:</span> {d.analysis || d.text || "-"}
                          {d.trap_type && <span className="ml-1 text-xs">({d.trap_type})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {explanation.vocabulary && explanation.vocabulary.length > 0 && (
                  <div>
                    <span className="font-medium">词汇:</span>
                    <div className="mt-1 space-y-1">
                      {explanation.vocabulary.map((v, i) => (
                        <div key={i} className="text-muted-foreground">
                          <span className="font-medium">{v.word}</span> — {v.meaning}
                          {v.freq && <span className="ml-1 text-xs">({v.freq})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {explanation.sentence_translation && explanation.sentence_translation.length > 0 && (
                  <div>
                    <span className="font-medium">句子翻译:</span>
                    <div className="mt-1 space-y-1">
                      {explanation.sentence_translation.map((s, i) => (
                        <div key={i} className="text-muted-foreground">
                          <div>{s.fr}{s.is_key && <span className="ml-1 text-xs text-amber-600">(key)</span>}</div>
                          <div className="text-xs">{s.zh}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">解析尚未生成。</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
