"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { searchByWatermark } from "@/lib/api/admin";
import type { WatermarkUserResult } from "@/lib/api/types";

export function WatermarkLookup() {
  const [image, setImage] = useState<string | null>(null);
  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [invert, setInvert] = useState(false);
  const [suffix, setSuffix] = useState("");
  const [results, setResults] = useState<WatermarkUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setContrast(1);
    setBrightness(1);
    setInvert(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!suffix.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchByWatermark(suffix.trim());
      setResults(data);
      if (data.length === 0) setError("No user found with this ID suffix");
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, [suffix]);

  const imageFilter = `contrast(${contrast}) brightness(${brightness})${invert ? " invert(1)" : ""}`;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Watermark Lookup</h3>
        <p className="text-sm text-muted-foreground">
          Upload a screenshot to reveal the watermark, then search by user ID to locate the account.
        </p>
      </div>

      {/* Image upload + enhancement */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Screenshot</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
          />
        </div>

        {image && (
          <>
            <div className="overflow-auto rounded border bg-muted/30 p-2" style={{ maxHeight: 400 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={image}
                alt="Uploaded screenshot"
                style={{ filter: imageFilter, maxWidth: "100%" }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Contrast: {contrast.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Brightness: {brightness.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={invert}
                    onChange={(e) => setInvert(e.target.checked)}
                  />
                  Invert colors
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search by ID suffix */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">User ID Suffix (from watermark)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="e.g. a3f8c2d1"
            className="flex-1 rounded-md border px-3 py-2 text-sm font-mono"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !suffix.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Found {results.length} user(s)</h4>
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.email}</span>
                {user.is_locked && (
                  <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    LOCKED
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground space-x-3">
                <span>ID: <code className="font-mono text-xs">{user.id}</code></span>
                {user.name && <span>Name: {user.name}</span>}
                <span>Role: {user.role}</span>
                {user.subscription_status && <span>Sub: {user.subscription_status}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
