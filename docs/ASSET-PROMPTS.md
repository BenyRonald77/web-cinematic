# Asset Prompts — Nano Banana (keyframe) & Kling (video)

## Cara kerja

1. Buat **K0** (frame awal scene 01) dari nol di Gemini → pilih "Create image", pakai Nano Banana Pro.
2. Semua keyframe berikutnya dibuat dengan **mengedit gambar sebelumnya** (upload gambar terakhir, lalu kasih prompt edit). Ini kunci konsistensi: kamera, latar, dan cahaya tetap sama.
3. Rantai keyframe:

```
K0 ──scene01──▶ K1 ──scene02──▶ K2 ──scene03──▶ K3 ──scene04──▶ K4
```

   Scene 01 = video dari K0 ke K1, scene 02 = K1 ke K2, dan seterusnya. Jadi cukup **5 gambar** untuk 4 video.
4. Simpan di `assets/keyframes/` dengan nama `k0` … `k4` (`.png` atau `.jpg`, file asli dari Gemini). Versi siap pakai, setelah warna latarnya disamakan, ada di `assets/keyframes/final/`: **pakai yang di `final/` untuk Kling.**
5. Di Kling: Image to Video → isi Start frame dan End frame → durasi 5s → rasio 16:9. Simpan hasil ke `assets/raw/scene-01.mp4` … `scene-04.mp4`.

Tips: generate 2–4 versi tiap keyframe dan pilih yang paling cocok dengan gambar sebelumnya. Kalau warna latar mulai bergeser, tambahkan kalimat "keep the exact same background color, lighting and camera position as the reference image".

## Blok gaya (tempel di setiap prompt Nano Banana)

```
Style: high-end commercial product photography, seamless warm cream backdrop (#EFE3D0), soft diffused key light from the left, gentle shadow to the right, shallow depth of field, photorealistic, 16:9 landscape, 1920x1080. Subject placed in the right half of the frame, left half is clean empty space for text. No text, no logos, no people, no hands.
```

## Keyframe

**K0 — awal scene 01**
```
A terracotta clay pour-over dripper sitting on top of an empty clear glass coffee server, centered in the right half of the frame. A single roasted coffee bean floats in mid-air above the dripper. The dripper is empty.
[blok gaya]
```

**K1 — akhir scene 01 / awal scene 02** (edit dari K0)
```
Edit this image: the dripper is now filled with a small heap of whole roasted coffee beans, a few beans still frozen mid-air as they fall into it. Keep the exact same camera angle, dripper, glass server, backdrop color and lighting.
```

**K2 — akhir scene 02 / awal scene 03** (edit dari K1)
```
Edit this image: the beans in the dripper are replaced by medium-ground coffee. A matte black gooseneck kettle enters from the upper right and pours a thin, smooth stream of hot water onto the grounds, with faint steam rising. Keep the exact same camera angle, dripper, glass server, backdrop color and lighting.
```

**K3 — akhir scene 03 / awal scene 04** (edit dari K2)
```
Edit this image: the kettle is gone. The coffee grounds in the dripper have bloomed into a domed, bubbly surface. Dark amber coffee drips from the dripper into the glass server, which is now about one third full. Keep the exact same camera angle, dripper, glass server, backdrop color and lighting.
```

**K4 — akhir scene 04** (edit dari K3)
```
Edit this image: the camera moves slightly closer and a little higher. The dripper and glass server are gone; in their exact place, in the RIGHT half of the frame, stands a wide matte ceramic cup on a saucer, filled with a latte with a beautiful swirling rosetta latte art pattern, seen from a gentle top-down angle. The left half of the frame stays clean empty space for text. Keep the exact same warm cream backdrop color and soft light from the left.
```

## Prompt Kling (per scene)

Pakai mode Start + End frame. Prompt menjelaskan **gerakan**, bukan isi gambar.

**Scene 01 (K0 → K1)**
```
Roasted coffee beans fall slowly one by one into the clay dripper and pile up, slow motion, static locked-off camera, smooth continuous motion, no cuts.
```

**Scene 02 (K1 → K2)**
```
The whole beans turn into ground coffee, a gooseneck kettle glides in from the upper right and starts pouring a thin stream of hot water, soft steam, slow motion, static camera, no cuts.
```

**Scene 03 (K2 → K3)**
```
The kettle lifts away and exits frame, the coffee grounds swell and bloom with small bubbles, coffee begins dripping into the glass server and slowly fills it, slow motion, static camera, no cuts.
```

**Scene 04 (K3 → K4)**
```
Slow smooth camera push-in and gentle tilt down. The pour-over dripper and glass server softly dissolve away as a ceramic cup with swirling latte art appears in the same place. Elegant, slow motion, no cuts.
```

**Negative prompt (semua scene)**
```
camera shake, cuts, scene change, flicker, text, watermark, logo, hands, people, distorted glass, blurry, low quality
```

## Cek sebelum lanjut ke script

- Tidak ada watermark di pojok video.
- Frame terakhir video scene N terlihat sama dengan frame pertama video scene N+1.
- Tidak ada gerakan kamera tiba-tiba di scene 01–03.
