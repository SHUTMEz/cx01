# LINE Image Capture Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้รูปที่ส่งเข้า LINE self bot ถูกส่งจาก worker เข้า `lineCapture` และเปิด Card modal ได้จริงใน packaged Windows app

**Architecture:** แยกการจำแนก LINE content type เป็น pure function แล้วให้ worker แปลงทุก inbound image/text event เป็น protocol เดียวกัน. AppBootstrap เป็น listener กลางเพียงจุดเดียวและแสดง worker errors เพื่อไม่ให้ production failure เงียบ

**Tech Stack:** Bun standalone worker, `@jsr/evex__linejs`, Tauri events, Zustand, Node test runner, Rust unit tests

**Spec:** `docs/superpowers/specs/2026-09-03-in-app-updater-design.md` (existing LINE behavior remains unchanged)

## Global Constraints

- ไม่เปลี่ยน database schema, Zustand store contract เดิม หรือ LINE login API
- รูปจาก LINE ต้องเป็น `image` event พร้อม base64 data และ MIME ที่ใช้แสดงใน browser ได้
- ข้อความต้องเป็น `text` event และไม่สร้าง capture หากยังไม่มีรูป ตาม flow เดิม
- Worker errors ต้องแสดงสถานะจริงและไม่ทำให้ UI ขึ้น Running หลอก

---

### Task 1: Lock message classification behavior

**Files:**
- Modify: `scripts/line-message.test.mjs`
- Modify: `scripts/line-message.mjs`

- [ ] **Step 1: Add failing cases** for `EXTIMAGE`, `21`, string numeric values, and unknown content types.
- [ ] **Step 2: Run `node scripts/line-message.test.mjs`** and confirm the new EXTIMAGE case fails before implementation.
- [ ] **Step 3: Implement the smallest classifier change** and keep unknown types returning `null`.
- [ ] **Step 4: Run the test again** and confirm all cases pass.
- [ ] **Step 5: Commit** with `fix: classify LINE image messages`.

### Task 2: Harden worker event conversion

**Files:**
- Modify: `scripts/line-service.mjs`
- Test: `scripts/line-message.test.mjs`

- [ ] **Step 1: Add a failing pure test** for image MIME fallback and text fallback when content type is missing.
- [ ] **Step 2: Run focused tests** and verify the expected failure.
- [ ] **Step 3: Implement safe MIME fallback, image base64 conversion, text fallback, and explicit `error` emission.**
- [ ] **Step 4: Run focused tests** and compile the worker with `bun build scripts/line-service.mjs --compile --outfile src-tauri/resources/line-service-v1.0.4.exe`.
- [ ] **Step 5: Commit** with `fix: harden LINE worker message events`.

### Task 3: Make Tauri worker lifecycle authoritative

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `app/line/page.tsx`
- Modify: `app/components/AppBootstrap.tsx`

- [ ] **Step 1: Add/update Rust unit coverage** for bundled worker candidate ordering and missing-service error.
- [ ] **Step 2: Run `cargo test --manifest-path src-tauri/Cargo.toml`** and confirm the lifecycle test fails if the behavior is absent.
- [ ] **Step 3: Flush stdin commands, return an error when no worker exists, update UI only from worker status events, and toast worker errors globally.**
- [ ] **Step 4: Run Rust tests and `pnpm exec tsc --noEmit`.**
- [ ] **Step 5: Commit** with `fix: report LINE worker lifecycle accurately`.

### Task 4: Package and verify the fixed worker

**Files:**
- Modify: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`
- Create: generated `src-tauri/resources/line-service-v1.0.4.exe`

- [ ] **Step 1: Bump app version to `1.0.4` and point resource mapping to the new worker name.**
- [ ] **Step 2: Run all existing focused tests, `cargo test`, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check`.**
- [ ] **Step 3: Build NSIS and MSI installers with the release config.**
- [ ] **Step 4: Manually test: login, Start Service, send image from another LINE account, confirm image modal, send text, confirm Check your Card.**
- [ ] **Step 5: Commit** with `fix: ship reliable LINE image capture`.

