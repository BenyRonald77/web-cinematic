# Asset Prompts — Satu aliran vertikal

## Konsep

Keempat scene adalah satu cerita yang mengalir ke bawah, seperti kamera yang turun mengikuti kopi jatuh. Di dua batas pertama, benda yang keluar dari tepi bawah scene N masuk dari tepi atas scene N+1 di posisi horizontal yang sama. Batas scene 03→04 disambung dengan gradasi: kopi berhenti di server kaca di scene 03, lalu server yang sama muncul lagi di atas scene 04, miring, menuang kopi ke cangkir.

```
┌──────────────────────────────┐
│ 01 Wake the beans            │   biji raksasa terbelah
│                       ( )    │
│                        ┊     │   ← biji kecil berjatuhan
├────────────────────────┊─────┤   PENYAMBUNG 1: kolom biji jatuh
│ 02 Grind it fresh      ┊     │
│                      [kaca]  │   biji masuk ke hopper grinder
│                        ┊     │   ← aliran bubuk kopi
├────────────────────────┊─────┤   PENYAMBUNG 2: aliran bubuk kopi
│ 03 Let it bloom        ┊   ⌐ │   teko hitam
│                       \_/    │   dripper terakota bergagang, bloom
│                       [  ]   │   server kaca, kopi menetes ke dalamnya
├──────────────────────────────┤   PENYAMBUNG 3: gradasi (tanpa aliran)
│ 04 Make time taste   [/] ⌐   │   server kaca miring + teko susu menuang
│    better             ┊┊     │   kopi + susu berpilin
│                      (~~)    │   cangkir latte art
└──────────────────────────────┘
          teks kiri    sumbu 70%
```

## Aturan supaya nyambung

1. **Semua benda di satu sumbu vertikal, sekitar 70% lebar gambar dari kiri.** Sisi kiri kosong untuk teks.
2. **Penyambung 01→02 dan 02→03 berupa aliran tipis** (kolom biji, aliran bubuk), bukan benda besar. Aliran tipis gampang disejajarkan; benda besar hampir mustahil dibuat pas oleh AI. **Penyambung 03→04 berupa gradasi:** tidak ada yang menembus batas, jadi tepi bawah s3-end dan tepi atas s4-start cukup sama-sama krem polos di sekitar batas.
3. **Semua benda melayang di ruang krem polos, tanpa meja atau garis lantai.** Kalau ada meja, tiap scene punya garis horizon sendiri dan sambungannya pasti kelihatan. Pengecualian: server kaca di scene 03 dan cangkir di scene 04 boleh punya bayangan lembut di bawahnya.
4. **Yang harus cocok:** tepi bawah gambar *end* scene N dengan tepi atas gambar *start* scene N+1. Saat batas section melintas di layar, dua frame inilah yang tampil bersamaan.
5. Sisa selisih posisi beberapa piksel dirapikan oleh Claude Code (geser horizontal per scene dan samakan warna).

## Daftar file

| File | Isi |
|---|---|
| `s1-start.jpg` | biji raksasa utuh |
| `s1-end.jpg` | biji terbelah, kolom biji jatuh keluar bawah |
| `s2-start.jpg` | kolom biji masuk dari atas ke hopper kosong |
| `s2-end.jpg` | hopper setengah penuh, aliran bubuk keluar bawah |
| `s3-start.jpg` | aliran bubuk masuk dari atas ke dripper terakota bergagang yang berdiri di atas server kaca kosong |
| `s3-end.jpg` | bloom + teko hitam menuang dari kanan atas, kopi menetes ke server (sepertiga penuh); tidak ada yang keluar lewat tepi bawah |
| `s4-start.jpg` | server kaca yang sama miring di atas (sebagian di luar frame) menuang kopi, teko susu stainless menuang susu; cangkir berisi kopi di bawah |
| `s4-end.jpg` | kopi dan susu berpilin seperti pita, cangkir dengan latte art |

Simpan file asli di `assets/keyframes/`. `npm run keyframes -- --target "#FAE8D4"` menyamakan warna latarnya dan menaruh hasilnya di `assets/keyframes/final/`: **pakai yang di `final/` untuk Flow.** Video disimpan sebagai `assets/raw/scene-01.mp4` … `scene-04.mp4` (timpa yang lama).

---

## Bagian 1 — Keyframe di Gemini

Pakai mode **Gambar**, rasio **16:9**, model yang sama untuk semua gambar (Hydrogen · Tinggi). Watermark tetap dimatikan.

### Blok gaya (tempel di akhir setiap prompt yang ditandai [GAYA])

```
Style: high-end commercial coffee product photography, seamless warm cream backdrop (#FAE8D4) filling the entire frame, no table, no floor, no horizon line, all objects levitating in mid-air, soft diffused key light from the left, gentle soft shadows, photorealistic, crisp detail, 16:9 landscape. All main objects are aligned on one vertical axis at 70% of the frame width from the left. The left half of the frame is clean empty space for text. No text, no logos, no people, no hands.
```

### s1-start (buat dari nol)

```
A single giant roasted coffee bean, glossy, rich dark brown, highly detailed surface texture, floating in mid-air in the upper-middle part of the frame, slightly tilted, centered on the vertical axis at 70% of the frame width. The bean is about one third of the frame height. Everything below the bean is empty cream space.
[GAYA]
```

### s1-end (upload s1-start, lalu edit)

```
Edit this image: the giant coffee bean has cracked open along its center line into two halves that drift slightly apart and tilt outward, like an opening shell. From the gap between the two halves, a dense cascade of small roasted coffee beans pours straight down in a narrow vertical column, about as wide as the original bean's crease, falling all the way to the bottom of the image and leaving the frame through the bottom edge at 70% of the frame width. Keep the bean halves at the same size and position as the original bean. Keep the exact same backdrop color, lighting and camera. 16:9 landscape.
```

### s2-start (upload s1-end sebagai referensi, buat frame baru)

```
Use the attached image only as a reference for style, color, lighting and the falling beans. Create the NEXT frame directly BELOW it, as if the camera moved straight down by one full frame.
At the top edge, the same narrow column of falling roasted coffee beans enters the frame at 70% of the frame width and falls straight down into the open top of a tall glass coffee grinder hopper: a clear glass cylinder with a brushed steel collar and small brass details, floating in mid-air in the middle of the frame on the same vertical axis. The hopper is still empty except for the first few beans landing at the bottom. Under the hopper is a short brass chute pointing straight down; nothing comes out of it yet, and the space below it is empty cream.
[GAYA]
```

### s2-end (upload s2-start, lalu edit)

```
Edit this image: the glass hopper is now half filled with roasted coffee beans, and beans are still falling into it from the top edge in the same narrow column. From the brass chute under the hopper, a steady narrow stream of fresh medium-ground coffee pours straight down and leaves the frame through the bottom edge at 70% of the frame width. Keep the exact same hopper, its size and position, the camera, backdrop color and lighting. 16:9 landscape.
```

### s3-start (upload s2-end sebagai referensi, buat frame baru)

```
Use the attached image only as a reference for style, color, lighting and the falling stream of ground coffee. Create the NEXT frame directly BELOW it, as if the camera moved straight down by one full frame.
At the top edge, the same narrow stream of ground coffee enters the frame at 70% of the frame width and falls straight down into a terracotta clay pour-over dripper with a small handle and a white paper filter, in the middle of the frame on the same vertical axis. The dripper sits on top of an empty clear glass coffee server with a handle, resting on an invisible surface with a soft shadow beneath it. The filter is just starting to fill with grounds. Nothing drips from the dripper yet.
[GAYA]
```

### s3-end (upload s3-start, lalu edit)

```
Edit this image: the stream of ground coffee from the top has stopped. The paper filter is filled with coffee grounds that have bloomed into a domed, glossy, bubbly surface. A matte black gooseneck kettle enters from the upper right corner, partly outside the frame, pouring a thin smooth stream of hot water onto the center of the grounds, with faint steam. Dark amber brewed coffee drips from the tip of the dripper into the glass server, which is now about one third full. Nothing leaves the frame through the bottom edge; the space below the server stays empty cream. Keep the exact same dripper and server, their size and position, the camera, backdrop color and lighting. 16:9 landscape.
```

### s4-start (upload s3-end sebagai referensi, buat frame baru)

```
Use the attached image only as a reference for style, color, lighting and the glass server filled with brewed coffee. Create the NEXT frame directly BELOW it, as if the camera moved straight down by one full frame.
At the top of the frame, partly outside the top edge, the same clear glass server is tilted and pours a stream of dark amber coffee. To its right, a brushed stainless steel milk pitcher, also partly outside the top edge, pours a stream of white steamed milk. Both streams fall into the center of a wide matte cream ceramic cup on a matching saucer in the lower part of the frame, on the same vertical axis at 70% of the frame width, resting on an invisible surface with a soft shadow beneath it. The cup holds dark coffee, no latte art yet. The area along the top edge between and around the two vessels is plain cream, so this frame meets the previous one in a soft gradient.
[GAYA]
```

### s4-end (upload s4-start, lalu edit)

```
Edit this image: the coffee and milk streams twist together into an elegant, sculptural spiral ribbon of glossy liquid falling into the cup, with a few small droplets suspended in the air. The cup now holds a creamy latte with a beautiful rosetta latte art pattern. Keep the exact same cup and saucer, their size and position, the camera, backdrop color and lighting. 16:9 landscape.
```

### Cek setiap gambar

- Benda utama di sumbu sekitar 70% lebar, sisi kiri kosong.
- Tidak ada meja, lantai, atau garis horizon (kecuali bayangan lembut server di scene 03 dan cangkir di scene 04).
- Gambar *end* scene 01–02: aliran benar-benar menyentuh tepi bawah. Gambar *end* scene 03: tepi bawah krem polos.
- Gambar *start* scene 02–03: aliran benar-benar masuk dari tepi atas, kira-kira di posisi yang sama dengan aliran di gambar *end* sebelumnya.
- Latar krem, tidak oranye. Gemini menggeser warna sedikit demi sedikit setiap kali gambar diedit; `npm run keyframes` meluruskannya.

---

## Bagian 2 — Video di Flow

Pengaturan untuk semua scene: 16:9, durasi terpanjang yang tersedia, x2 (pilih yang terbaik). Saat Flow menampilkan rencana, pastikan frame awal dan akhir tidak tertukar.

Kalimat penutup yang sama untuk semua prompt (sudah termasuk di bawah):
`Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.`

### scene-01 (s1-start → s1-end)

```
Create a video using s1-start.jpg as the FIRST frame and s1-end.jpg as the LAST frame. 16:9, longest duration available.
Motion: the giant coffee bean hangs in the air and rotates very slightly. Then it slowly cracks open along its center line; the two halves drift apart like an opening shell. Small roasted coffee beans begin to pour out of the gap and form a steady narrow column that falls straight down and exits through the bottom edge of the frame. The column stays at the same horizontal position the whole time and never stops once it starts.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### scene-02 (s2-start → s2-end)

```
Create a video using s2-start.jpg as the FIRST frame and s2-end.jpg as the LAST frame. 16:9, longest duration available.
Motion: roasted coffee beans keep falling from the top edge into the glass hopper for the entire video, in the same narrow column, and the hopper fills up gradually. Halfway through, fresh ground coffee starts to pour from the brass chute under the hopper and forms a steady narrow stream that falls straight down and exits through the bottom edge of the frame. The hopper and chute never move. Nothing bounces out of the hopper.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### scene-03 (s3-start → s3-end)

```
Create a video using s3-start.jpg as the FIRST frame and s3-end.jpg as the LAST frame. 16:9, longest duration available.
Motion: ground coffee streams in from the top edge and fills the paper filter, then the stream from the top thins out and stops. A matte black gooseneck kettle slides in slowly from the upper right corner and pours a thin stream of hot water onto the grounds; the grounds swell and bloom with small bubbles and faint steam. Then brewed coffee begins to drip from the tip of the dripper into the glass server below and slowly fills it to about one third. Nothing falls out of the bottom of the frame. The kettle is matte black from the first moment it appears. The dripper and server never move.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### scene-04 (s4-start → s4-end)

```
Create a video using s4-start.jpg as the FIRST frame and s4-end.jpg as the LAST frame. 16:9, longest duration available.
Motion: the tilted glass server and the steel milk pitcher at the top keep pouring for the entire video; the coffee stream and the milk stream slowly twist around each other into a graceful spiral ribbon of glossy liquid, pouring into the center of the cup. White foam spreads across the coffee and a rosetta latte art pattern forms layer by layer. A few small droplets float in the air. The server, the pitcher, the cup and the saucer never move.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### Cek setiap video

- Aliran penyambung (biji, bubuk) tetap di posisi horizontal yang sama dari awal sampai akhir.
- Di akhir video scene 01–02, aliran masih menyentuh tepi bawah. Scene 03 berakhir dengan tepi bawah krem polos.
- Lebar, kepadatan, dan warna kolom biji di akhir scene 01 kira-kira sama dengan di awal scene 02 (lihat tabel kolom biji di "Hasil keyframe").
- Tidak ada benda yang tiba-tiba berganti warna atau bentuk di detik-detik terakhir.
- Tidak ada watermark.

---

## Hasil keyframe (19 Nov 2026)

- Kedelapan gambar 2752×1536 (rasio 1,7917, sekitar 0,8% lebih lebar dari 16:9), tanpa watermark terlihat.
- Warna latar asli makin oranye di setiap edit: ΔE terhadap #FAE8D4 naik dari 6,4 (s1-start) sampai 16,7 (s4-end). Setelah `npm run keyframes -- --target "#FAE8D4"`, semuanya ΔE ≤ 0,4 tanpa highlight yang terpotong.
- Posisi penyambung (x = fraksi lebar gambar, diukur dengan `npm run flow -- --keyframes assets/keyframes/final`):

| Batas | Tepi bawah *end* | Tepi atas *start* | Selisih | offsetX sementara |
|---|---|---|---|---|
| 01→02 kolom biji | s1-end 0,6626 | s2-start 0,6880 | −0,0254 | scene-02 −0,025 |
| 02→03 aliran bubuk | s2-end 0,6804 | s3-start 0,6777 | +0,0027 | scene-03 −0,023 |
| 03→04 | gradasi | gradasi | — | — |

Angka ini perkiraan awal; nilai final diukur dari frame video dengan `npm run flow`, karena Veo biasanya menggeser posisi sedikit.

Kolom biji di batas 01→02 (s2-start diedit ulang supaya kolomnya lebih lebar dan padat; versi pertama disimpan sebagai `s2-start.old.jpg`):

| Tepi (pita 5% tinggi gambar) | Pusat | 80% biji di dalam | Lebar | Kepadatan | Warna biji (L\*) |
|---|---|---|---|---|---|
| s1-end bawah | 0,662 | 0,618–0,706 | 0,088 | 71% | 25 |
| s2-start atas, versi pertama | 0,683 | 0,657–0,711 | 0,054 | 73% | — |
| s2-start atas, versi sekarang | 0,682 | 0,594–0,768 | 0,174 | 90% | 33 |

Versi sekarang kebalikan dari versi pertama: kolomnya kira-kira 2× lebih lebar dari ujung kolom s1-end (melebar terutama ke kanan), lebih padat, dan bijinya lebih terang (sangrai lebih muda). Target lebar sekitar 0,09–0,10 (≈ 250–275 px dari 2752 px), biji sangrai gelap seperti di s1-end.

---

## Copy scene 02

Karena scene 02 sekarang tentang menggiling biji, copy-nya diganti:
- Judul: **Grind it fresh.**
- Subcopy: "Ground seconds before brewing, one cup at a time."
