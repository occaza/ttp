-- ==============================================================================
-- Titipin - CMS (Blog & Static Pages), Media Manager & Promo Popups
-- ==============================================================================

-- 1. Media Assets Table (supports Supabase Storage, Cloudflare R2, or External URLs)
create table if not exists public.media_assets (
    id uuid primary key default gen_random_uuid(),
    file_name text not null,
    storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'r2', 'external')),
    storage_path text,
    public_url text not null,
    mime_type text not null default 'image/jpeg',
    size_bytes integer not null default 0,
    alt_text text,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- 2. CMS Contents Table (Blog Posts & Static Pages)
create table if not exists public.cms_contents (
    id uuid primary key default gen_random_uuid(),
    content_type text not null check (content_type in ('post', 'page')),
    title text not null,
    slug text not null unique,
    excerpt text,
    body text not null,
    cover_image_url text,
    status text not null default 'draft' check (status in ('draft', 'published')),
    author_id uuid references public.profiles(id) on delete set null,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Promo Popups Table
create table if not exists public.promo_popups (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    image_url text,
    cta_label text not null default 'Lihat Promo',
    cta_href text not null default '/pesan',
    is_active boolean not null default false,
    starts_at timestamptz,
    ends_at timestamptz,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists idx_media_assets_created on public.media_assets(created_at desc);
create index if not exists idx_cms_contents_type_status on public.cms_contents(content_type, status, published_at desc);
create index if not exists idx_cms_contents_slug on public.cms_contents(slug);
create index if not exists idx_promo_popups_active on public.promo_popups(is_active, created_at desc);

-- 5. Enable RLS
alter table public.media_assets enable row level security;
alter table public.cms_contents enable row level security;
alter table public.promo_popups enable row level security;

-- 6. RLS Policies: media_assets
drop policy if exists "Public can view media assets" on public.media_assets;
create policy "Public can view media assets"
    on public.media_assets
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Admins can manage media assets" on public.media_assets;
create policy "Admins can manage media assets"
    on public.media_assets
    for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

-- 7. RLS Policies: cms_contents
drop policy if exists "Public can view published cms contents" on public.cms_contents;
create policy "Public can view published cms contents"
    on public.cms_contents
    for select
    to anon, authenticated
    using (
        status = 'published'
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Admins can manage cms contents" on public.cms_contents;
create policy "Admins can manage cms contents"
    on public.cms_contents
    for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

-- 8. RLS Policies: promo_popups
drop policy if exists "Public can view active promo popups" on public.promo_popups;
create policy "Public can view active promo popups"
    on public.promo_popups
    for select
    to anon, authenticated
    using (
        is_active = true
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Admins can manage promo popups" on public.promo_popups;
create policy "Admins can manage promo popups"
    on public.promo_popups
    for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

-- 9. Public Storage Bucket for Media Manager
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for public-media" on storage.objects;
create policy "Public read access for public-media"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'public-media');

drop policy if exists "Admins can upload to public-media" on storage.objects;
create policy "Admins can upload to public-media"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'public-media'
        and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Admins can delete from public-media" on storage.objects;
create policy "Admins can delete from public-media"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'public-media'
        and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );


-- 10. Seed default Indonesian legal pages (editable via Admin CMS)
insert into public.cms_contents (content_type, title, slug, excerpt, body, status, published_at)
values
(
    'page',
    'Syarat dan Ketentuan',
    'syarat-ketentuan',
    'Ketentuan penggunaan layanan jasa titip belanja dan pengantaran lokal Titipin.',
    '<h2>1. Ruang Lingkup Layanan</h2><p>Titipin adalah layanan jasa titip belanja dan pengantaran lokal yang beroperasi di area Kecamatan Gatak, Kartasura, dan sekitarnya. Pesanan dijalankan langsung oleh pengelola atau mitra terdaftar sesuai cakupan wilayah aktif.</p><h2>2. Pemesanan dan Harga Barang</h2><ul><li>Pelanggan wajib menuliskan nama toko tujuan, daftar barang, jumlah, dan alamat pengantaran secara jelas.</li><li>Harga barang yang dibayarkan mengikuti harga pembelian di toko tujuan, terpisah dari tarif jasa titip yang ditampilkan sebelum konfirmasi.</li><li>Apabila barang di toko tujuan habis atau mengalami perubahan harga signifikan, kurir akan menghubungi pelanggan melalui fitur chat pesanan atau WhatsApp sebelum membeli.</li></ul><h2>3. Pembayaran dan Verifikasi</h2><p>Pembayaran dapat dilakukan melalui tunai saat barang diterima (COD), transfer bank manual, atau QRIS manual. Untuk pembayaran non-tunai, bukti transfer diverifikasi oleh pengelola sebelum status pembayaran dinyatakan lunas.</p><h2>4. Pembatalan dan Laporan Kendala</h2><p>Pelanggan dapat membatalkan pesanan selama status masih menunggu konfirmasi. Apabila terdapat kendala barang kurang, rusak, atau salah kirim, pelanggan dapat mengajukan laporan pada halaman detail pesanan untuk ditindaklanjuti oleh Admin.</p><h2>5. Hukum yang Berlaku</h2><p>Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia, termasuk ketentuan transaksi elektronik dalam UU ITE dan peraturan perdagangan melalui sistem elektronik yang berlaku.</p>',
    'published',
    now()
),
(
    'page',
    'Kebijakan Privasi',
    'privasi',
    'Penjelasan pengumpulan, penggunaan, dan perlindungan data pribadi pengguna sesuai UU PDP No. 27 Tahun 2022.',
    '<h2>1. Dasar Pengelolaan Data</h2><p>Titipin mengelola data pribadi pengguna sesuai prinsip pelindungan data pribadi yang diatur dalam Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</p><h2>2. Data yang Dikumpulkan</h2><ul><li><strong>Data Akun:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp, dan peran akun.</li><li><strong>Data Alamat:</strong> Alamat pengantaran, nama penerima, nomor kontak penerima, dan catatan patokan lokasi.</li><li><strong>Data Transaksi &amp; Komunikasi:</strong> Rincian pesanan, riwayat status, pesan chat terkait pesanan, serta bukti pembayaran atau nota belanja.</li></ul><h2>3. Tujuan Penggunaan Data</h2><p>Data digunakan untuk memproses pesanan titip belanja, menghubungi pelanggan saat belanja atau pengantaran, memverifikasi pembayaran manual, serta menangani laporan kendala.</p><h2>4. Keamanan dan Penyimpanan</h2><p>Lampiran bukti pembayaran dan nota pesanan disimpan pada bucket privat dengan akses terbatas sesuai peran. Titipin tidak menjual atau menyewakan data pribadi pengguna kepada pihak ketiga untuk keperluan pemasaran.</p><h2>5. Hak Subjek Data</h2><p>Pengguna berhak mengakses, memperbarui data profil dan alamat melalui halaman Dasbor Akun, serta meminta penghapusan akun atau penarikan persetujuan dengan menghubungi pengelola Titipin.</p>',
    'published',
    now()
),
(
    'page',
    'Disclaimer Layanan',
    'disclaimer',
    'Batasan tanggung jawab dan cakupan operasional layanan Titipin.',
    '<h2>1. Sifat Layanan Perantara Belanja</h2><p>Titipin bertindak sebagai jasa titip pembelian dan pengantaran lokal dari warung, pasar, apotek, maupun toko fisik di sekitar Gatak dan Kartasura. Titipin bukan produsen atau pemilik barang yang diperjualbelikan oleh toko tujuan.</p><h2>2. Ketersediaan dan Kualitas Barang</h2><p>Ketersediaan stok, rasa makanan, masa kedaluwarsa, dan garansi produk sepenuhnya bergantung pada toko atau penjual asal. Kurir akan memeriksa kondisi fisik barang secara wajar saat pembelian sesuai catatan pelanggan.</p><h2>3. Estimasi Waktu dan Jarak</h2><p>Estimasi waktu pengantaran dan perhitungan jarak di sistem bersifat perkiraan operasional dan dapat berubah mengikuti kondisi lalu lintas, antrean toko, atau cuaca di lapangan.</p><h2>4. Barang Terlarang</h2><p>Titipin berhak menolak pesanan yang berkaitan dengan barang ilegal, berbahaya, obat-obatan terlarang tanpa resep sah, atau barang yang melanggar peraturan perundang-undangan di Indonesia.</p>',
    'published',
    now()
)
on conflict (slug) do nothing;
