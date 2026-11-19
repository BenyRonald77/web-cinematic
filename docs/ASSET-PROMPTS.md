# Asset Prompts — Satu aliran vertikal

## Konsep

Keempat scene adalah satu cerita yang mengalir ke bawah, seperti kamera yang turun mengikuti kopi jatuh. Benda yang keluar dari tepi bawah scene N harus masuk dari tepi atas scene N+1, di posisi horizontal yang sama.

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
│                       \_/    │   dripper terakota, bloom
│                        ┊     │   ← aliran kopi seduh
├────────────────────────┊─────┤   PENYAMBUNG 3: aliran kopi
│ 04 Make time taste     ┊┊    │   kopi + susu berpilin
│    better             (~~)   │   cangkir latte art
└──────────────────────────────┘
          teks kiri    sumbu 70%
```

## Aturan supaya nyambung

1. **Semua benda di satu sumbu vertikal, sekitar 70% lebar gambar dari kiri.** Sisi kiri kosong untuk teks.
2. **Penyambung antar-scene selalu berupa aliran tipis** (kolom biji, aliran bubuk, aliran cairan), bukan benda besar. Aliran tipis gampang disejajarkan; benda besar hampir mustahil dibuat pas oleh AI.
3. **Semua benda melayang di ruang krem polos, tanpa meja atau garis lantai.** Kalau ada meja, tiap scene punya garis horizon sendiri dan sambungannya pasti kelihatan. Pengecualian: cangkir di akhir scene 04 boleh punya bayangan lembut.
4. **Yang harus cocok:** tepi bawah gambar *end* scene N dengan tepi atas gambar *start* scene N+1. Saat batas section melintas di layar, dua frame inilah yang tampil bersamaan.
5. Sisa selisih posisi beberapa piksel dirapikan oleh Claude Code (geser horizontal per scene dan samakan warna).

## Daftar file

| File | Isi |
|---|---|
| `s1-start.jpg` | biji raksasa utuh |
| `s1-end.jpg` | biji terbelah, kolom biji jatuh keluar bawah |
| `s2-start.jpg` | kolom biji masuk dari atas ke hopper kosong |
| `s2-end.jpg` | hopper setengah penuh, aliran bubuk keluar bawah |
| `s3-start.jpg` | aliran bubuk masuk dari atas ke dripper |
| `s3-end.jpg` | bloom + teko menuang, aliran kopi keluar bawah |
| `s4-start.jpg` | aliran kopi + susu masuk dari atas, cangkir berisi espresso |
| `s4-end.jpg` | pilinan kopi-susu, cangkir dengan latte art |

Simpan di `assets/keyframes/`. Video disimpan sebagai `assets/raw/scene-01.mp4` … `scene-04.mp4` (timpa yang lama).

---

## Bagian 1 — Keyframe di Gemini

Pakai mode **Gambar**, rasio **16:9**, model yang sama untuk semua gambar (Hydrogen · Tinggi). Watermark tetap dimatikan.

### Blok gaya (tempel di akhir setiap prompt yang ditandai [GAYA])

```
Style: high-end commercial coffee product photography, seamless warm cream backdrop (#F9E7D4) filling the entire frame, no table, no floor, no horizon line, all objects levitating in mid-air, soft diffused key light from the left, gentle soft shadows, photorealistic, crisp detail, 16:9 landscape. All main objects are aligned on one vertical axis at 70% of the frame width from the left. The left half of the frame is clean empty space for text. No text, no logos, no people, no hands.
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
At the top edge, the same narrow stream of ground coffee enters the frame at 70% of the frame width and falls straight down into a terracotta clay pour-over dripper with a white paper filter, floating in mid-air in the middle of the frame on the same vertical axis. The filter is just starting to fill with grounds. Nothing comes out of the bottom of the dripper yet, and the space below it is empty cream.
[GAYA]
```

### s3-end (upload s3-start, lalu edit)

```
Edit this image: the stream of ground coffee from the top has stopped. The paper filter is filled with coffee grounds that have bloomed into a domed, glossy, bubbly surface. A matte black gooseneck kettle enters from the upper right corner, partly outside the frame, pouring a thin smooth stream of hot water onto the center of the grounds, with faint steam. From the bottom tip of the dripper, a thin continuous stream of dark amber brewed coffee falls straight down and leaves the frame through the bottom edge at 70% of the frame width. Keep the exact same dripper, its size and position, the camera, backdrop color and lighting. 16:9 landscape.
```

### s4-start (upload s3-end sebagai referensi, buat frame baru)

```
Use the attached image only as a reference for style, color, lighting and the falling stream of brewed coffee. Create the NEXT frame directly BELOW it, as if the camera moved straight down by one full frame.
At the top edge, the same thin stream of dark amber coffee enters the frame at 70% of the frame width and falls straight down. A second stream of white steamed milk enters from the top edge right beside it, and the two streams begin to twist loosely around each other as they fall. In the lower part of the frame, on the same vertical axis, a wide matte cream ceramic cup on a matching saucer, resting on an invisible surface with a soft shadow beneath it, filled with dark espresso with golden crema, no latte art yet. The streams fall into the center of the cup.
[GAYA]
```

### s4-end (upload s4-start, lalu edit)

```
Edit this image: the coffee and milk streams twist together into an elegant, sculptural spiral ribbon of glossy liquid falling into the cup, with a few small droplets suspended in the air. The cup now holds a creamy latte with a beautiful rosetta latte art pattern. Keep the exact same cup and saucer, their size and position, the camera, backdrop color and lighting. 16:9 landscape.
```

### Cek setiap gambar

- Benda utama di sumbu sekitar 70% lebar, sisi kiri kosong.
- Tidak ada meja, lantai, atau garis horizon (kecuali bayangan cangkir di scene 04).
- Gambar *end*: aliran benar-benar menyentuh tepi bawah.
- Gambar *start* scene 2–4: aliran benar-benar masuk dari tepi atas, kira-kira di posisi yang sama dengan aliran di gambar *end* sebelumnya.
- Latar krem, tidak oranye.

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
Motion: ground coffee streams in from the top edge and fills the paper filter, then the stream from the top thins out and stops. A matte black gooseneck kettle slides in slowly from the upper right corner and pours a thin stream of hot water onto the grounds; the grounds swell and bloom with small bubbles and faint steam. Then brewed coffee begins to drip from the bottom tip of the dripper and becomes a thin continuous stream falling straight down through the bottom edge of the frame. The kettle is matte black from the first moment it appears. The dripper never moves.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### scene-04 (s4-start → s4-end)

```
Create a video using s4-start.jpg as the FIRST frame and s4-end.jpg as the LAST frame. 16:9, longest duration available.
Motion: the coffee stream and the milk stream keep falling from the top edge for the entire video and slowly twist around each other into a graceful spiral ribbon of glossy liquid, pouring into the center of the cup. White foam spreads across the espresso and a rosetta latte art pattern forms layer by layer. A few small droplets float in the air. The cup and saucer never move.
Camera: completely static, locked-off, no zoom, no pan, no tilt. Style: slow motion, smooth, photorealistic, soft light from the left, warm cream backdrop. No cuts, no scene change, no text, no music.
```

### Cek setiap video

- Aliran penyambung (biji, bubuk, kopi) tetap di posisi horizontal yang sama dari awal sampai akhir.
- Di akhir video, aliran masih menyentuh tepi bawah (kecuali scene 04).
- Tidak ada benda yang tiba-tiba berganti warna atau bentuk di detik-detik terakhir.
- Tidak ada watermark.

---

## Copy scene 02

Karena scene 02 sekarang tentang menggiling biji, copy-nya diganti:
- Judul: **Grind it fresh.**
- Subcopy: "Ground seconds before brewing, one cup at a time."
