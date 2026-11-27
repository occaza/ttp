# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Warga lokal dan mahasiswa di area Kecamatan Gatak, Sukoharjo, serta wilayah sekitarnya (Gawok, Trangsan, Mayang, Kartasura, dan area UMS) yang membutuhkan bantuan titip belanja kebutuhan harian, kuliner, pasar tradisional, obat apotek, maupun antar-jemput barang/dokumen lokal secara cepat dan jujur.

Pengelola sekunder adalah Owner Titipin yang menjalankan operasional secara langsung (_founder-led runner_) mulai dari menerima pesanan, berbelanja ke lokasi, mengunggah bukti struk kasir, memverifikasi pembayaran manual, hingga mengantarkan barang ke alamat pemesan.

## Product Purpose

Titipin memungkinkan pelanggan menitipkan daftar belanja atau pengantaran lokal dengan rincian tarif jasa yang jelas sejak awal, komunikasi terikat pesanan, pelacakan progres status pengantaran, dan verifikasi pembayaran manual tanpa perantara payment gateway.

Keberhasilan produk diukur dari kecepatan penyelesaian pesanan harian di area Gatak–Kartasura, kejelasan biaya sebelum pesanan dikirim, dan kepercayaan pelanggan melalui bukti struk kasir fisik asli.

## Positioning

Transparansi nota kasir asli toko fisik 100% tanpa markup harga barang: harga barang yang dibayar pelanggan murni sesuai struk kasir asli toko, dipisahkan secara tegas dari tarif jasa titip (_flat_ atau terhitung di server) yang ditampilkan di awal.

## Operating Context

- **Mode Solo-Operasional (Founder-led)**: Pada tahap pilot belum ada mitra pihak ketiga; Owner membangun sistem sekaligus terjun langsung berbelanja dan mengantar pesanan. Pendaftaran mitra eksternal dikontrol lewat sakelar di Owner Console (`/admin`).
- **Siklus Pesanan & Pelacakan**: Pesanan menggunakan kode pendek unik (`TP-XXXXXX`) dengan status terstruktur (`pending` → `accepted` → `shopping` → `purchased` → `delivering` → `completed`, atau `cancelled`/`rejected`) serta pelacakan berbasis linimasa status, bukan GPS _real-time_.
- **Pembayaran Manual Pilot**: Metode yang didukung adalah COD Tunai, Transfer Bank Manual, dan QRIS Manual. Status pembayaran (`unpaid`, `awaiting_verification`, `verified`, `rejected`, `refunded`) dikelola terpisah dari status pesanan, dengan bukti transfer yang wajib diverifikasi manual oleh Admin/Kurir.
- **Komunikasi & Bukti**: Chat terikat pesanan, notifikasi dalam aplikasi, kontak WhatsApp kurir, serta lampiran privat (foto struk kasir asli dan bukti pengantaran) yang dilindungi akses berbasis peran.

## Capabilities and Constraints

- **Bahasa**: Seluruh antarmuka dan pesan sistem untuk pengguna berbahasa Indonesia.
- **Batasan Pilot**: Tidak menggunakan payment gateway atau escrow otomatis, tidak menggunakan pelacakan GPS langsung, dan jarak rute memakai kalkulasi matriks/Haversine lokal (`isMock: true`) hingga penyedia peta ditetapkan.
- **Otorisasi & Integritas**: Perubahan status pesanan, verifikasi pembayaran, dan manajemen kategori/pengaturan platform divalidasi di sisi server serta dicatat pada riwayat audit (_order status history_ dan _payment events_).
- **Ketentuan Belum Diputuskan**: Penyedia layanan peta/routing berbayar dan jadwal pembukaan pendaftaran mitra eksternal secara publik belum ditentukan.

## Brand Commitments

- **Nama Produk**: Titipin.
- **Kejujuran Operasional**: Tidak mengklaim jumlah mitra atau kapasitas fiktif; seluruh salinan publik mencerminkan layanan langsung oleh pengelola Titipin di Gatak.
- **Kejelasan Biaya**: Biaya barang dan biaya jasa titip selalu dipisahkan secara eksplisit.

## Evidence on Hand

- Katalog kategori layanan dan penawaran layanan aktif milik Owner tersimpan di database Supabase (`service_categories`, `provider_profiles`, `provider_services`).
- Aturan tarif dasar Gatak tersimpan di `pricing_rules` serta mesin snapshot harga server-side (`PricingSnapshot`).
- Tidak ada testimoni pelanggan terpublikasi atau studi kasus eksternal di repositori; fitur ulasan dijadwalkan pada Phase 10.

## Product Principles

1. **Harga Barang Murni Sesuai Struk**: Tidak ada markup tersembunyi pada harga barang; foto struk kasir asli menjadi bukti utama.
2. **Kejelasan Sebelum Konfirmasi**: Rincian estimasi biaya jasa dan alur pembayaran manual tampil jelas sebelum pelanggan mengirim pesanan.
3. **Alur Cepat di Ponsel**: Pelanggan dan pengelola harus bisa memeriksa status, mengunggah struk/bukti, dan mengirim pesan tanpa langkah berulang.
4. **Kepatuhan Verifikasi Manual**: Bukti transfer yang diunggah pelanggan tidak pernah dianggap lunas sebelum diverifikasi oleh pihak berwenang.
5. **Kejujuran Skala Pilot**: Antarmuka selalu merepresentasikan kondisi operasional nyata (_founder-led_) tanpa angka atau klaim palsu.

## Accessibility & Inclusion

- Dukungan navigasi keyboard dan indikator fokus yang jelas pada seluruh kontrol interaktif.
- Target sentuh dan ukuran input ramah perangkat seluler (`>= 16px` pada perangkat sentuh untuk mencegah auto-zoom iOS Safari).
- Kontras warna teks dan status memenuhi keterbacaan standar (WCAG AA), tanpa mengandalkan warna saja untuk menyampaikan status.
