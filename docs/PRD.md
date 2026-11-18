# PRD — Pelan Coffee Cinematic Landing Page

> Versi 0.1 · 18 Nov 2026 · Status: draft untuk dieksekusi dengan Claude Code
> "Pelan Coffee" adalah nama sementara (placeholder). Ganti nama, kota, dan copy kapan saja; struktur PRD tidak berubah.

## 1. Ringkasan

Landing page satu halaman untuk brand kopi specialty fiktif. Bagian atas halaman berupa rangkaian scene "cinematic" yang bergerak mengikuti scroll: biji kopi jatuh, air dituang, kopi mekar di dripper, lalu berakhir di secangkir latte. Teks muncul bertahap di tiap scene. Setelah scene selesai, halaman berlanjut ke section biasa (menu, cerita, lokasi, footer).

Referensinya video "Cinematic Websites with AI" (contoh kopi). Kita meniru teknik dan ritmenya, bukan brand, logo, warna khas, atau copy dari situs mana pun.

## 2. Tujuan

- Home terasa seperti film pendek yang dikendalikan scroll, mulus di desktop dan tetap enak di HP.
- Jadi portofolio teknik scroll-driven image sequence yang bisa dipakai ulang untuk klien lain (komponen dan pipeline aset dibuat generik).
- Fondasi Next.js yang siap dikembangkan (halaman Shop, Menu, dsb.) tanpa bongkar ulang.

Bukan tujuan versi ini: e-commerce/checkout, CMS, multi-bahasa, login.

## 3. Target & perangkat

- Pengunjung umum, bahasa konten: Inggris.
- Desktop (Chrome, Safari, Edge, Firefox terbaru) dan mobile (iOS Safari, Chrome Android).
- Lebar acuan: 1440px desktop, 390px mobile.

## 4. Stack

| Bagian | Pilihan |
|---|---|
| Framework | Next.js (versi terbaru, App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animasi | GSAP + ScrollTrigger + SplitText, `@gsap/react` (`useGSAP`) |
| Smooth scroll | Lenis, disinkronkan ke ScrollTrigger |
| Render sequence | `<canvas>` 2D, gambar `.webp` |
| Pipeline aset | ffmpeg (video → frame), script Node di `scripts/` |
| Deploy | Vercel |

Tidak memakai Three.js/WebGL. Canvas 2D sudah cukup dan jauh lebih ringan.

## 5. Struktur halaman

```
[Navbar fixed]  logo · Home · Menu · Our Story · Visit · [Order now]

SCENE 01  "Wake the beans"        (pinned, cinematic)
SCENE 02  "Pour it slow"          (pinned, cinematic)
SCENE 03  "Let it bloom"          (pinned, cinematic)
SCENE 04  "Make time taste better" (pinned, cinematic)

SECTION   Menu highlight (3–4 kartu produk)
SECTION   Our story (teks + 1 foto)
SECTION   Visit (alamat, jam buka, peta/ilustrasi)
FOOTER    sosial media, copyright
```

## 6. Scene cinematic

Kamera, latar, dan pencahayaan konsisten di semua scene: latar krem polos hangat, cahaya lembut dari kiri, gaya foto produk studio. Frame terakhir tiap scene = frame pertama scene berikutnya, supaya pergantian scene tidak terasa loncat.

| # | Copy utama | Visual (awal → akhir) | Posisi teks |
|---|---|---|---|
| 01 | **Wake the beans** / *one by one.* + subcopy + tombol "Order now" & "See the menu" | Dripper keramik terakota di atas server kaca kosong, satu biji kopi melayang di atas → biji-biji kopi berjatuhan pelan dan menumpuk di dalam dripper | Kiri, subjek di kanan |
| 02 | **Pour it slow.** | Dripper berisi bubuk kopi → teko leher angsa masuk dari kanan atas dan menuang air panas, uap tipis naik | Kiri |
| 03 | **Let it bloom.** | Bubuk kopi mengembang (bloom) → tetesan kopi jatuh dan server kaca terisi kopi kecokelatan | Kiri bawah |
| 04 | **Make time taste better.** | Kopi dituang ke cangkir keramik berisi susu → pusaran latte art, kamera sedikit mendekat dan agak dari atas | Kanan, subjek di kiri |

Setiap scene:
- Di-*pin* selama sekitar 250–300vh scroll.
- Frame index = progres scroll scene itu (scrub, tidak autoplay).
- Penomoran kecil "01 —", "02 —" di atas judul, seperti referensi.
- Teks masuk dengan SplitText (per baris/kata, naik + fade), keluar sebelum scene berikutnya mulai.
- Indikator "SCROLL" kecil di scene 01, hilang setelah mulai scroll.

### Copy sementara (Inggris)

- 01: "Wake the beans" / "one by one." / "Single-origin beans from across the archipelago, roasted in small batches every week."
- 02: "Pour it slow." / "Ninety-two degrees. Thirty seconds of patience."
- 03: "Let it bloom." / "The first breath of the grounds is where the flavour begins."
- 04: "Make time taste better." / "Sit down. Stay a while." + tombol "Visit us"

## 7. Section non-cinematic

- **Menu highlight**: 3–4 kartu (foto, nama, deskripsi singkat, harga). Data dari file `src/data/menu.ts`, belum CMS.
- **Our story**: 2 paragraf + 1 foto (bisa dibuat Nano Banana dengan gaya yang sama).
- **Visit**: alamat, jam buka, link Google Maps (placeholder).
- **Footer**: Instagram, WhatsApp, email, copyright.

Animasi di section ini cukup reveal halus saat masuk viewport. Jangan pakai efek berat.

## 8. Arah visual

- Palet: krem hangat (latar), cokelat kopi tua (teks), satu warna aksen untuk CTA. Aksen dipilih sendiri dan tidak meniru merah situs referensi; usulan awal: hijau zaitun tua atau terakota.
- Tipografi: serif tebal dan rapat untuk judul (misal Fraunces / Playfair Display via `next/font`), sans-serif bersih untuk body (misal Inter / Manrope). Judul scene besar (clamp sekitar 64–140px desktop).
- Banyak ruang kosong. Teks di satu sisi, subjek di sisi lain.

## 9. Pipeline aset

1. **Keyframe (Nano Banana Pro di Gemini)**: untuk tiap scene, buat frame awal dan frame akhir, 16:9, minimal 1920×1080. Frame akhir scene N dipakai sebagai frame awal scene N+1. Prompt ada di `docs/ASSET-PROMPTS.md`.
2. **Video (Kling, start + end frame)**: 5 detik per scene, kamera statis atau gerak sangat pelan, tanpa cut, tanpa watermark (lihat catatan akun di bagian 12).
3. **Ekstrak frame (otomatis lewat script)**: `assets/raw/scene-0X.mp4` → `public/sequences/scene-0X/{desktop,mobile}/0001.webp ...`
   - Desktop: lebar 1600px, kualitas WebP ±72, target 90–120 frame per scene.
   - Mobile: lebar 900px, ambil tiap frame kedua (±50–60 frame).
4. **Manifest**: script menulis `src/data/sequences.json` (jumlah frame, ukuran, path) agar komponen tidak hardcode.

Video mentah dan keyframe tidak masuk git (`assets/raw/` di-.gitignore); hanya frame hasil ekstrak yang di-commit.

## 10. Kebutuhan teknis & performa

- **Komponen `ScrollSequence`** generik: props `sceneId`, `frameCount`, `focusX` (0–1, titik fokus subjek untuk crop di mobile), `children` (overlay teks).
- Gambar digambar dengan logika "cover" di canvas, mengikuti devicePixelRatio (maksimal 2).
- **Preload bertahap**: scene 01 dimuat duluan (20 frame pertama prioritas, sisanya menyusul), scene lain dimuat saat mendekati viewport. Tampilkan frame pertama sebagai poster sambil menunggu.
- Total aset desktop target ≤ 35 MB, mobile ≤ 12 MB.
- Lighthouse mobile: Performance ≥ 80, CLS < 0.1, LCP < 2.5s (frame pertama scene 01 sebagai LCP, di-preload).
- `prefers-reduced-motion`: matikan scrub, tampilkan frame akhir tiap scene sebagai gambar statis dengan teks biasa.
- Animasi hanya `transform` dan `opacity`. Semua ScrollTrigger dibersihkan saat unmount (`useGSAP` scope).
- Resize/orientasi berubah: canvas di-resize dan ScrollTrigger di-refresh.

## 11. Kriteria selesai (Definition of Done)

- [ ] 4 scene berjalan mulus maju-mundur saat scroll, tidak ada frame kosong atau kedip.
- [ ] Teks tiap scene masuk dan keluar sesuai urutan, terbaca jelas di atas gambar.
- [ ] Tampil benar di 1440px, 1024px, dan 390px.
- [ ] Reduced-motion berfungsi.
- [ ] Lighthouse mobile memenuhi target di bagian 10.
- [ ] Deploy di Vercel dan bisa dibuka dari HP.

## 12. Risiko & keputusan yang masih terbuka

| Hal | Status / catatan |
|---|---|
| Akun Kling gratis | Plan gratis memberi kredit sangat sedikit, video ber-watermark, 720p, dan tidak boleh untuk komersial. Tidak cukup untuk 4 scene + percobaan ulang. Pilihan: (a) Kling Standard 1 bulan, (b) coba fitur frame awal–akhir Veo lewat Flow/Gemini dari langganan Google AI Pro (cek dulu ada watermark atau tidak), (c) prototipe dulu pakai 1 scene. **Perlu diputuskan.** |
| Nama brand & aksen warna | Placeholder "Pelan Coffee". **Perlu diputuskan sebelum final.** |
| Konsistensi visual antar scene | Diatasi dengan rantai frame (akhir N = awal N+1) dan prompt gaya yang sama persis. |
| Berat aset di mobile | Diatasi dengan set frame mobile terpisah dan preload bertahap. |

## 13. Urutan pengerjaan (milestone)

1. Setup project Next.js, Tailwind, GSAP, Lenis, struktur folder. Dummy sequence (frame angka 1–120 hasil generate script) untuk menguji scroll sebelum aset asli ada.
2. Komponen `ScrollSequence` + preload + canvas cover + reduced-motion, diuji dengan dummy.
3. Script ekstrak frame + manifest.
4. Masukkan aset asli scene 01, rapikan teks & animasi. Ulangi untuk scene 02–04.
5. Section non-cinematic + navbar + footer.
6. Optimasi performa, uji perangkat, deploy.
