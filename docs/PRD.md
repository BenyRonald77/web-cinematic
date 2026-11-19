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

SCENE 01  "Wake the beans"        (scroll-linked, cinematic)
SCENE 02  "Grind it fresh"        (scroll-linked, cinematic)
SCENE 03  "Let it bloom"          (scroll-linked, cinematic)
SCENE 04  "Make time taste better" (scroll-linked, cinematic)

SECTION   Menu highlight (3–4 kartu produk)
SECTION   Our story (teks + 1 foto)
SECTION   Visit (alamat, jam buka, peta/ilustrasi)
FOOTER    sosial media, copyright
```

## 6. Scene cinematic

Keempat scene adalah **satu aliran vertikal** yang mengalir ke bawah, seperti kamera yang turun mengikuti kopi jatuh. Latar krem polos tanpa meja atau garis lantai, cahaya lembut dari kiri, gaya foto produk studio. Semua benda berada di satu sumbu vertikal sekitar 70% lebar gambar; sisi kiri kosong untuk teks. Di batas 01→02 dan 02→03, aliran tipis yang keluar dari tepi bawah frame akhir scene N masuk dari tepi atas frame awal scene N+1 di posisi horizontal yang sama. Batas 03→04 disambung dengan gradasi (detail di `docs/ASSET-PROMPTS.md`).

| # | Copy utama | Visual (awal → akhir) | Posisi teks |
|---|---|---|---|
| 01 | **Wake the beans** / *one by one.* + subcopy + tombol "Order now" & "See the menu" | Biji kopi raksasa melayang → biji terbelah, kolom biji kecil berjatuhan keluar lewat tepi bawah | Kiri, subjek di kanan |
| 02 | **Grind it fresh.** | Kolom biji masuk dari atas ke hopper grinder kaca → hopper terisi, aliran bubuk kopi keluar lewat tepi bawah | Kiri |
| 03 | **Let it bloom.** | Aliran bubuk masuk dari atas ke dripper terakota di atas server kaca → bloom, teko hitam menuang, kopi menetes ke server | Kiri bawah |
| 04 | **Make time taste better.** | Server kaca yang sama, miring di atas, menuang kopi bersama teko susu ke cangkir → keduanya berpilin, cangkir dengan latte art | Kiri, subjek di kanan |

Setiap scene:
- Gambar **tertahan di layar** selama video scene itu berjalan (sekitar satu layar scroll), sementara teks tetap ikut bergulir. Setelah video selesai, gambar ikut bergulir ke atas dan scene berikutnya masuk dari bawah.
- Saat batas section melintas di layar, yang tampil selalu frame akhir scene N dan frame awal scene N+1, sehingga aliran terlihat menembus batas. Lebar gradasi diatur per batas: 2% tinggi layar di batas yang dilewati aliran (01→02, 02→03), sekitar 12% di batas 03→04 yang berupa gradasi.
- Selisih posisi horizontal aliran di batas dirapikan dengan `offsetX` per scene (diukur dengan `npm run flow`).
- Frame index = progres scroll selama gambar tertahan (scrub, tidak autoplay).
- Penomoran kecil "01 —", "02 —" di atas judul, seperti referensi.
- Teks scene 01 tampil sejak awal (intro CSS). Teks scene 02–04 masuk per baris/kata (naik + fade) saat masuk layar, lalu ikut bergulir keluar.
- Indikator "SCROLL" kecil di scene 01, hilang setelah mulai scroll.

### Copy sementara (Inggris)

- 01: "Wake the beans" / "one by one." / "Single-origin beans from across the archipelago, roasted in small batches every week."
- 02: "Grind it fresh." / "Ground seconds before brewing, one cup at a time."
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

1. **Keyframe (Nano Banana Pro di Gemini)**: untuk tiap scene, buat frame awal dan frame akhir (`s1-start.jpg` … `s4-end.jpg`), 16:9. Tepi atas frame awal scene N+1 melanjutkan aliran di tepi bawah frame akhir scene N. Warna latarnya disamakan dengan `npm run keyframes` (hasil di `assets/keyframes/final/`). Prompt ada di `docs/ASSET-PROMPTS.md`.
2. **Video (Flow/Veo, start + end frame)**: durasi terpanjang yang tersedia, kamera statis, tanpa cut, tanpa watermark. Aliran penyambung tetap di posisi horizontal yang sama dan masih menyentuh tepi bawah di akhir video (kecuali scene 04).
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
| Konsistensi visual antar scene | Diatasi dengan satu sumbu vertikal, aliran tipis sebagai penyambung, latar tanpa meja, prompt gaya yang sama persis, penyamaan warna keyframe, dan `offsetX` per scene. |
| Berat aset di mobile | Diatasi dengan set frame mobile terpisah dan preload bertahap. |

## 13. Urutan pengerjaan (milestone)

1. Setup project Next.js, Tailwind, GSAP, Lenis, struktur folder. Dummy sequence (frame angka 1–120 hasil generate script) untuk menguji scroll sebelum aset asli ada.
2. Komponen `ScrollSequence` + preload + canvas cover + reduced-motion, diuji dengan dummy.
3. Script ekstrak frame + manifest.
4. Masukkan aset asli scene 01, rapikan teks & animasi. Ulangi untuk scene 02–04.
5. Section non-cinematic + navbar + footer.
6. Optimasi performa, uji perangkat, deploy.
