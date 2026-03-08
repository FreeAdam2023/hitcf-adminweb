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

