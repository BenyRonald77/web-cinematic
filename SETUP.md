# SETUP — dari nol sampai siap vibe coding (Windows)

## 1. Install sekali saja

Buka PowerShell (tidak perlu Administrator):

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Gyan.FFmpeg
irm https://claude.ai/install.ps1 | iex
```

Tutup lalu buka lagi PowerShell, cek:

```powershell
node -v
git --version
ffmpeg -version
claude --version
```

Di VS Code, install ekstensi **Claude Code** (dari Anthropic). Login pakai akun Claude Pro saat pertama kali menjalankan `claude`.

## 2. Siapkan folder project

1. Ekstrak zip ini, misal ke `D:\Projects\pelan-coffee`.
2. Buka folder itu di VS Code (File → Open Folder).
3. Buka terminal VS Code, jalankan `claude`.
4. Claude Code akan menanyakan izin untuk MCP server dari `.mcp.json` (Playwright & Context7). Pilih setuju.
5. Ketik `/mcp` untuk memastikan keduanya terhubung.

Kalau Playwright muncul "Connection closed" di Windows, ganti blok `playwright` di `.mcp.json` jadi:

```json
"playwright": { "command": "cmd", "args": ["/c", "npx", "-y", "@playwright/mcp@latest"] }
```

## 3. Prompt pertama ke Claude Code

Salin ini apa adanya:

```
Baca CLAUDE.md dan docs/PRD.md. Kerjakan milestone 1 dan 2 dari PRD bagian 13:
scaffold Next.js (App Router, TypeScript, Tailwind, src/) di folder ini tanpa menghapus file yang sudah ada,
install gsap, @gsap/react, lenis, buat struktur folder sesuai CLAUDE.md,
buat scripts/make-dummy-frames.mjs lalu generate dummy frame untuk 4 scene,
dan bangun komponen ScrollSequence lengkap dengan preload, canvas cover, dan reduced-motion.
Tunjukkan rencanamu dulu sebelum mulai menulis kode.
```

Setelah itu lanjut per milestone. Satu milestone per sesi lebih aman daripada semuanya sekaligus, dan lebih hemat kuota Claude Pro.

## 4. Sambil Claude Code bekerja: bikin aset

Ikuti `docs/ASSET-PROMPTS.md`:
1. Gemini (Nano Banana Pro) → `assets/keyframes/k0.png` … `k4.png`
2. Kling (start + end frame) → `assets/raw/scene-01.mp4` … `scene-04.mp4`
3. Minta Claude Code: "Jalankan npm run frames dan ganti dummy dengan aset asli."

## 5. Deploy

Push ke GitHub, import repo di vercel.com, deploy. Tidak perlu konfigurasi tambahan.
