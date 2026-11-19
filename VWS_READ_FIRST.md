# VACAY WITH STRANGERS — HANDOVER UNTUK ANTIGRAVITY

**Tanggal:** 15 Oktober 2026  
**Status:** Scope V1 disepakati; beberapa nilai bisnis dan compliance masih harus dikonfirmasi sebelum website dipublikasikan.

## Baca berurutan

1. `VWS_PRD_v1.0.md` — tujuan produk, seluruh alur UX publik, aturan booking/cicilan, admin VWS Studio, scope P0/P1, acceptance criteria, design gate, dan hal yang belum final.
2. `VWS_ERD_v1.0.md` — ERD Mermaid, definisi tabel, relasi, invariant database, audit ledger, proses refund/reschedule dan pengujian integritas.
3. PDF dengan nama sama adalah versi **untuk dibaca/review**, bukan sumber yang lebih mutakhir daripada Markdown.

## Scope locked

- Public: immersive hero dan featured trip, Explore Trips, Trip Detail, itinerary interaktif, Full / Land Tour Only, pilihan harga, simulator cicilan, WhatsApp CTA, dokumentasi trip yang benar-benar pernah terjadi.
- Operasional: satu admin; dashboard kelola negara, trip series, batch, itinerary, harga, media, homepage, booking grup dan individu, alokasi seat manual, DP/cicilan, refund manual, reschedule case-by-case.
- Pembayaran: DP non-refundable untuk pembatalan yang diajukan peserta; DP transfer saat pindah batch case-by-case; cicilan bulanan dengan tanggal fleksibel dan lunas maksimal H-30.
- Tidak ada customer login, checkout/payment gateway, multi-admin, auto-hold seat, automated refund atau testimoni fiktif.

## Masih wajib dikonfirmasi sebelum production

1. Harga/DP final setiap paket Full dan Land, variasi kamar, promo dan masa berlakunya (materi poster bukan sumber transaksi final).
2. DP dihitung per peserta atau per booking, dan dipotong dari total harga atau tidak (model awal mengasumsikan per peserta dan termasuk total).
3. Patokan akhir cicilan setiap bulan (rekomendasi: akhir bulan, kecuali pelunasan H-30) dan penanganan kurang bayar.
4. Aturan menerima booking setelah H-30, termasuk kemungkinan pelunasan penuh yang disetujui admin.
5. Redaksi resmi kebijakan pembatalan/DP/refund, termasuk jika **VWS yang membatalkan**, persetujuan peserta serta ketentuan perlindungan konsumen.
6. Data batch aktif, rute, itinerary, fasilitas, meeting point, dokumentasi publik dan izin penggunaan foto; serta ketentuan privasi.
7. Provider database, auth, media storage, hosting, backup dan lisensi webfont setelah architecture proposal.

## Arahan implementasi untuk Antigravity

**Jangan langsung coding satu produk penuh.** Mulai dari audit PRD–ERD, keluarkan daftar konflik/kekurangan dan rancangan arsitektur beserta trade-off/cost. Minta persetujuan sebelum Gate G1–G2. Jalankan tahapan G0 hingga G5 seperti di PRD. Gagal satu gate berarti harus diperbaiki dan dites ulang sebelum lanjut. Deploy production hanya setelah approval owner.

Wajib mempertahankan brand yang sudah ada, bukan membuat visual identity baru. Art direction: **Hybrid — playful but classy** dengan foto nyata, hierarchy kuat, whitespace, micro-interaction fungsional, tanpa AI slop. Jangan menambah modul atau copy penjelas generik. Dashboard admin boleh praktis dan efisien; jangan diubah menjadi dashboard SaaS penuh statistik kosong.

Tidak boleh ada harga dummy, seat palsu, testimonial rekaan, itinerary batch yang tertukar, atau label internal seperti `Draft`, `Demo`, `Test`, `Staging`, `Preview`, `Internal` di halaman public production. Jika nilai belum dikonfirmasi, simpan unpublished dan tampilkan state jujur.

**Contoh pembatasan:** Untuk trip 7 Nov 2026, batas pelunasan H-30 jatuh 8 Okt 2026; pada 15 Okt 2026 jangan tawarkan skema cicilan baru otomatis untuk batch tersebut.

## Sumber visual/konten milik owner

- `KV-Vacay With Stranger.pdf`
- `Vacay With Strangers Autumn 2026.jpg`
- `Vacay With Strangers Autumn 2026 (2).jpg`
- `Vacay With Strangers General Itinerary - 7-14 November 2026-03.jpg`
- `Onboarding Winter In Japan 9 - 14 January 2026 |Vacay With Strangers .pdf`
- `[Itinerary 9-14 January] Winter In Japan-Vacay With Strangers.pdf`

Pisahkan Januari (historis) dari November (contoh Autumn). Jangan mencampur itinerary, tanggal, foto, atau harga antar batch. Jangan mengunggah data pribadi dari onboarding ke website publik.
