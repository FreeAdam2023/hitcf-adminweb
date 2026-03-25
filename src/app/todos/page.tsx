"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/lib/api/admin";
import type { TodoItem } from "@/lib/api/types";
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const COLUMNS = [
  { key: "todo" as const, label: "待办", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
  { key: "in_progress" as const, label: "进行中", icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  { key: "done" as const, label: "已完成", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
];

const PRIORITY_CONFIG = {
  urgent: { label: "紧急", color: "bg-red-600 text-white" },
  high: { label: "高", color: "bg-orange-500 text-white" },
  medium: { label: "中", color: "bg-blue-500 text-white" },
  low: { label: "低", color: "bg-gray-400 text-white" },
};

const NEXT_STATUS: Record<string, string> = { todo: "in_progress", in_progress: "done" };
const PREV_STATUS: Record<string, string> = { in_progress: "todo", done: "in_progress" };

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await createTodo({ title: newTitle.trim(), priority: newPriority });
      setNewTitle("");
      setNewPriority("medium");
      await load();
    } catch {}
    setAdding(false);
  };

  const handleMove = async (id: string, newStatus: string) => {
    try {
      await updateTodo(id, { status: newStatus });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus as TodoItem["status"] } : t)));
    } catch {}
  };

  const handlePriority = async (id: string, priority: string) => {
    try {
      await updateTodo(id, { priority });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, priority: priority as TodoItem["priority"] } : t)));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">待办事项</h1>
        <p className="text-sm text-muted-foreground">拖拽卡片或点击箭头移动状态</p>
      </div>

      {/* Add new */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="新建待办事项..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <Button onClick={handleAdd} disabled={adding || !newTitle.trim()} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = sorted.filter((t) => t.status === col.key);
          return (
            <Card key={col.key} className={col.bg}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <col.icon className={`h-4 w-4 ${col.color}`} />
                  {col.label}
                  <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {items.map((todo) => {
                  const pc = PRIORITY_CONFIG[todo.priority];
                  const next = NEXT_STATUS[todo.status];
                  const prev = PREV_STATUS[todo.status];
                  const priorities = ["urgent", "high", "medium", "low"];
                  const pIdx = priorities.indexOf(todo.priority);
                  return (
                    <div
                      key={todo.id}
                      className="group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${todo.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                            {todo.title}
                          </p>
                          {todo.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <Badge className={`shrink-0 text-[10px] ${pc.color}`}>
                          {pc.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {prev && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(todo.id, prev)}>
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                          )}
                          {next && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(todo.id, next)}>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {pIdx > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePriority(todo.id, priorities[pIdx - 1])}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                          )}
                          {pIdx < priorities.length - 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePriority(todo.id, priorities[pIdx + 1])}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleDelete(todo.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">暂无事项</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
