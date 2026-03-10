## 2026-03-10 (9a53f4d)

### Features
- add website traffic overview to admin dashboard (cb3a552)

---

## 2026-03-10 (2ca303a)

### Features
- add ops workbench UI + localize sidebar (运营工作台) (bea008f)

---

## 2026-03-10 (1747e2d)

### Features
- add funnel, segments, cohort retention & LTV analytics tabs (425d5f9)

---

## 2026-03-10 (8a774ae)

### Bug Fixes
- remove unused SheetClose import (lint error) (2c9c9fc)

---

## 2026-03-10 (2bf282a)

### Features
- collapsible sidebar groups + Quick Links page (f147eaf)
- add competitors module — list, detail, comparison matrix, monitor (7d0e225)

---

## 2026-03-09 (1172d16)

### Features
- watermark lookup tool for user identification (d4b2166)

---

## 2026-03-09 (477cc67)

### Bug Fixes
- CI/CD notify only on failure to save email quota (7b2b984)

---

## 2026-03-08 (2fe79a7)

### Refactor
- add pending status to admin referral UI (2fe79a7)

---

## 2026-03-08 (4437616)

### Tests
- add admin referral API tests (3 tests) (4437616)

---

## 2026-03-08 (ed547c9)

### Features
- add referral management to admin dashboard (#12) (ed547c9)

### CI/CD
- update changelog workflow push comment (406c8da)

---

# Changelog

## 2026-03-08 (e85312a)

### Features
- add cost overview card to admin dashboard (a8fde51)
- admin dashboard overhaul — colorful UI, geo map, user detail, reports (e5dd512)
- user tracking display in admin user detail panel (5079957)
- add audio timestamp editor for listening questions (0147863)
- add post-deploy smoke test to CI/CD (f671147)
- add Resend email notification to CI/CD pipeline (27ea220)
- add Google Search Console and Bing Webmaster to external services (1631303)
- add Insights tab to analytics with 6 advanced charts (03a6d46)
- add feedback management page in admin dashboard (e648365)
- add favicon and icon for browser tab (f157bf7)
- add NextAuth auth, vocabulary module, Docker deploy support (d7dfce3)

### Bug Fixes
- resolve eslint errors in adminweb (8b86eae)
- null-safe dashboard stats to prevent client-side crash (eaca538)
- use Azure CLI for container deploy instead of publish profile (43e1a5b)
- add public/.gitkeep so Dockerfile COPY succeeds in CI (b38d5aa)
- correct CI/CD workflow for Azure deployment (e540dcd)

### Refactor
- redesign analytics page with KPI cards, geo map, compact heatmap (adbb5ad)

### Tests
- add Vitest frontend tests (14 tests) (73765ae)

### CI/CD
- add automatic CHANGELOG generation on push to main (e85312a)
- split lint-and-build into parallel lint + test jobs (5799cb6)

---

