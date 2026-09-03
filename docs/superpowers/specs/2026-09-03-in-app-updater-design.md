# CRTL In-App Update Design

## Goal

ให้แอปตรวจสอบ GitHub Release ล่าสุดและให้ผู้ใช้ดาวน์โหลด installer รุ่นใหม่จากภายในแอปได้อย่างปลอดภัย โดยไม่กระทบข้อมูลในเครื่องหรือ LINE service

## Scope

- ตรวจสอบ release ที่ `SHUTMEz/cx01` จาก GitHub API
- เปรียบเทียบ semantic version กับ version ที่ build อยู่
- แสดงสถานะใน Settings และ Right Context: กำลังตรวจสอบ, ใหม่กว่า, ล่าสุด, หรือเช็กไม่ได้
- ให้ผู้ใช้กดยืนยันก่อนดาวน์โหลดและเปิด installer
- ใช้ NSIS installer เป็นตัวอัปเดทหลัก และมี MSI เป็น fallback link
- เปิด installer ผ่าน Tauri shell หลังดาวน์โหลดเสร็จ แล้วปิดแอปเมื่อผู้ใช้ยืนยัน
- ไม่เปลี่ยน database schema, Zustand contract เดิม หรือ LINE worker protocol

## UX

- เช็กอัตโนมัติหนึ่งครั้งหลัง app bootstrap พร้อม timeout สั้นและไม่บล็อกการใช้งาน
- มีปุ่ม `Check for updates` ใน Settings/Right Context
- เมื่อมีรุ่นใหม่ แสดง version ปัจจุบัน, version ใหม่, release note แบบย่อ และปุ่ม `Update now`
- ระหว่างดาวน์โหลดแสดง progress/สถานะและปิดปุ่มซ้ำ
- ถ้าเครือข่ายหรือ GitHub ใช้งานไม่ได้ แสดง `Unable to check for updates` และให้ลองใหม่ได้
- ถ้าไม่มีรุ่นใหม่ แสดง `You’re up to date`

## Architecture

- แยก pure update logic ไว้ใน `app/update/updateService.ts` เพื่อ test version comparison, release parsing, asset selection และ error states โดยไม่ผูกกับ React
- ใช้ `fetch` สำหรับ GitHub Releases API โดยจำกัด response และ timeout
- ใช้ Tauri shell `open()` เปิด asset URL ให้ระบบดาวน์โหลดผ่าน browser/default handler; ไม่อ่านหรือส่งข้อมูลส่วนตัว
- ใช้ release asset ชื่อ `crtl_<version>_x64-setup.exe` เป็น Windows update action
- ไม่ auto-install และไม่รันไฟล์ที่ดาวน์โหลดเองโดยไม่มี user click

## Security and failure handling

- รับเฉพาะ HTTPS URL ที่อยู่บน `github.com` หรือ `objects.githubusercontent.com`
- รับเฉพาะ release ที่ไม่ใช่ draft/prerelease และ version ใหม่กว่าแบบ semantic version
- ถ้า asset หายหรือ version parse ไม่ได้ ให้ fail closed และแสดงข้อผิดพลาด
- ไม่เก็บ token หรือข้อมูลบัญชี LINE ใน request

## Testing

- Unit tests สำหรับ semantic version comparison, release parsing, asset selection และ URL allowlist
- TypeScript check และ Next production build
- Tauri build ตรวจว่า shell permission เดิมรองรับการเปิด URL
- Manual QA ที่ 360px และ desktop: latest, update available, network error, download action, และ disabled/loading states

