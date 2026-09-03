# In-App Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ CRTL ตรวจ GitHub Release ล่าสุดและเปิด installer รุ่นใหม่จากปุ่ม Update now ในแอปได้อย่างปลอดภัย

**Architecture:** แยก pure update logic ใน `app/update/updateService.ts` สำหรับ version, release parsing, asset selection และ URL allowlist. React จะใช้ hook/component เล็กๆ เรียก GitHub API แบบ timeout และใช้ Tauri shell เปิด installer URL หลังผู้ใช้กดยืนยัน

**Tech Stack:** Next.js, React, TypeScript, Tauri shell plugin, GitHub Releases API, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-03-in-app-updater-design.md`

## Global Constraints

- ไม่เปลี่ยน database schema, Zustand store contract เดิม หรือ LINE worker protocol
- รับเฉพาะ release ที่ไม่เป็น draft/prerelease และ version ใหม่กว่า semantic version ปัจจุบัน
- รับเฉพาะ HTTPS asset URL ของ GitHub ที่ allowlist ไว้
- ไม่ auto-install หรือรันไฟล์โดยไม่มี user click
- ไม่เพิ่ม dependency ใหม่ถ้า shell plugin เดิมเพียงพอ

---

### Task 1: Pure update service

**Files:**
- Create: `app/update/updateService.ts`
- Create: `app/update/updateService.test.mjs`

**Interfaces:**
- Produces `compareVersions(current: string, latest: string): number`
- Produces `parseRelease(payload: unknown): UpdateRelease | null`
- Produces `selectWindowsInstaller(release: UpdateRelease): string | null`
- Produces `isAllowedUpdateUrl(value: string): boolean`

- [ ] **Step 1: Write failing tests** for semantic comparison, malformed release, prerelease filtering, NSIS asset selection, and URL allowlist.
- [ ] **Step 2: Run `node app/update/updateService.test.mjs`** and confirm it fails because the service is not implemented.
- [ ] **Step 3: Implement the pure functions** with no browser/Tauri imports and reject malformed or unsafe data.
- [ ] **Step 4: Run the test again** and confirm all cases pass.
- [ ] **Step 5: Commit** with `feat: add GitHub release update service`.

### Task 2: Update check state and GitHub API adapter

**Files:**
- Create: `app/update/useUpdateCheck.ts`
- Test: `app/update/updateService.test.mjs`

**Interfaces:**
- Produces `UpdateCheckState = idle | checking | available | up-to-date | error`
- Produces `checkForUpdate(currentVersion: string, fetcher?: typeof fetch): Promise<UpdateCheckResult>`

- [ ] **Step 1: Add failing tests** for GitHub response parsing, timeout/fetch failure, latest version, and available update.
- [ ] **Step 2: Run focused tests** and verify the new cases fail for the expected missing behavior.
- [ ] **Step 3: Implement a 5-second timeout, one request to `https://api.github.com/repos/SHUTMEz/cx01/releases`, and fail-closed parsing.**
- [ ] **Step 4: Run focused tests** and verify all update states pass.
- [ ] **Step 5: Commit** with `feat: add GitHub update check state`.

### Task 3: Update UI in Settings and Right Context

**Files:**
- Create: `app/update/UpdateBanner.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `app/components/RightContext.tsx`

**Interfaces:**
- Consumes `useUpdateCheck()` and `UpdateCheckResult`
- Produces buttons `Check for updates` and `Update now`, with disabled/loading/error states

- [ ] **Step 1: Add a UI test or pure render-state test** covering idle, checking, available, up-to-date, and error labels.
- [ ] **Step 2: Run that test and verify the available-update expectation fails.**
- [ ] **Step 3: Implement the minimal responsive banner/panel using existing tokens and `toast`, with release notes shortened to three lines.**
- [ ] **Step 4: Wire `Update now` to `open(assetUrl)` only after a user click and a final allowlist check.**
- [ ] **Step 5: Run TypeScript and focused tests.**
- [ ] **Step 6: Commit** with `feat: add in-app update controls`.

### Task 4: Verify updater in production build

**Files:**
- Modify: `src-tauri/tauri.conf.json` only if shell permission needs an explicit update
- Test: built app and release asset URLs

- [ ] **Step 1: Run `node app/update/updateService.test.mjs`.**
- [ ] **Step 2: Run `pnpm exec tsc --noEmit` and `pnpm build`.**
- [ ] **Step 3: Run `git diff --check`.**
- [ ] **Step 4: Manually verify Settings at 360px and desktop for all update states.**
- [ ] **Step 5: Commit any required permission/config change** with a focused message.
