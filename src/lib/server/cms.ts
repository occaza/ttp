import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	CmsContent,
	CmsContentStatus,
	CmsContentType,
	Database,
	Json,
	MediaAsset,
	MediaStorageProvider,
	PromoPopup
} from '#lib/types/database.types.js';

async function recordAuditLog(
	supabase: SupabaseClient<Database>,
	actorId: string,
	actorRole: string,
	entry: {
		action: string;
		target_type: string;
		target_id?: string | null;
		metadata?: Record<string, unknown>;
	}
): Promise<void> {
	try {
		await supabase.from('audit_logs').insert({
			actor_id: actorId,
			actor_role: actorRole,
			action: entry.action,
			target_type: entry.target_type,
			target_id: entry.target_id ?? null,
			metadata: (entry.metadata ?? {}) as Json
		});
	} catch (err) {
		console.warn('[CMS] Audit log fallback:', err);
	}
}

const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MEDIA_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const fallbackMediaStore: MediaAsset[] = [];
const fallbackCmsStore: CmsContent[] = [];
const fallbackPromoStore: PromoPopup[] = [];

const DEFAULT_LEGAL_PAGES: CmsContent[] = [
	{
		id: 'legal-tos',
		content_type: 'page',
		title: 'Syarat dan Ketentuan',
		slug: 'syarat-ketentuan',
		excerpt: 'Ketentuan penggunaan layanan jasa titip belanja dan pengantaran lokal Titipin.',
		body: '<h2>1. Ruang Lingkup Layanan</h2><p>Titipin adalah layanan jasa titip belanja dan pengantaran lokal yang beroperasi di area Kecamatan Gatak, Kartasura, dan sekitarnya. Pesanan dijalankan langsung oleh pengelola atau mitra terdaftar sesuai cakupan wilayah aktif.</p><h2>2. Pemesanan dan Harga Barang</h2><ul><li>Pelanggan wajib menuliskan nama toko tujuan, daftar barang, jumlah, dan alamat pengantaran secara jelas.</li><li>Harga barang yang dibayarkan mengikuti harga pembelian di toko tujuan, terpisah dari tarif jasa titip yang ditampilkan sebelum konfirmasi.</li><li>Apabila barang di toko tujuan habis atau mengalami perubahan harga signifikan, kurir akan menghubungi pelanggan melalui fitur chat pesanan atau WhatsApp sebelum membeli.</li></ul><h2>3. Pembayaran dan Verifikasi</h2><p>Pembayaran dapat dilakukan melalui tunai saat barang diterima (COD), transfer bank manual, atau QRIS manual. Untuk pembayaran non-tunai, bukti transfer diverifikasi oleh pengelola sebelum status pembayaran dinyatakan lunas.</p><h2>4. Pembatalan dan Laporan Kendala</h2><p>Pelanggan dapat membatalkan pesanan selama status masih menunggu konfirmasi. Apabila terdapat kendala barang kurang, rusak, atau salah kirim, pelanggan dapat mengajukan laporan pada halaman detail pesanan untuk ditindaklanjuti oleh Admin.</p><h2>5. Hukum yang Berlaku</h2><p>Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia, termasuk ketentuan transaksi elektronik dalam UU ITE dan peraturan perdagangan melalui sistem elektronik yang berlaku.</p>',
		cover_image_url: null,
		status: 'published',
		author_id: null,
		published_at: '2026-11-28T00:00:00.000Z',
		created_at: '2026-11-28T00:00:00.000Z',
		updated_at: '2026-11-28T00:00:00.000Z'
	},
	{
		id: 'legal-privacy',
		content_type: 'page',
		title: 'Kebijakan Privasi',
		slug: 'privasi',
		excerpt:
			'Penjelasan pengumpulan, penggunaan, dan perlindungan data pribadi pengguna sesuai UU PDP No. 27 Tahun 2022.',
		body: '<h2>1. Dasar Pengelolaan Data</h2><p>Titipin mengelola data pribadi pengguna sesuai prinsip pelindungan data pribadi yang diatur dalam Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</p><h2>2. Data yang Dikumpulkan</h2><ul><li><strong>Data Akun:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp, dan peran akun.</li><li><strong>Data Alamat:</strong> Alamat pengantaran, nama penerima, nomor kontak penerima, dan catatan patokan lokasi.</li><li><strong>Data Transaksi &amp; Komunikasi:</strong> Rincian pesanan, riwayat status, pesan chat terkait pesanan, serta bukti pembayaran atau nota belanja.</li></ul><h2>3. Tujuan Penggunaan Data</h2><p>Data digunakan untuk memproses pesanan titip belanja, menghubungi pelanggan saat belanja atau pengantaran, memverifikasi pembayaran manual, serta menangani laporan kendala.</p><h2>4. Keamanan dan Penyimpanan</h2><p>Lampiran bukti pembayaran dan nota pesanan disimpan pada bucket privat dengan akses terbatas sesuai peran. Titipin tidak menjual atau menyewakan data pribadi pengguna kepada pihak ketiga untuk keperluan pemasaran.</p><h2>5. Hak Subjek Data</h2><p>Pengguna berhak mengakses, memperbarui data profil dan alamat melalui halaman Dasbor Akun, serta meminta penghapusan akun atau penarikan persetujuan dengan menghubungi pengelola Titipin.</p>',
		cover_image_url: null,
		status: 'published',
		author_id: null,
		published_at: '2026-11-28T00:00:00.000Z',
		created_at: '2026-11-28T00:00:00.000Z',
		updated_at: '2026-11-28T00:00:00.000Z'
	},
	{
		id: 'legal-disclaimer',
		content_type: 'page',
		title: 'Disclaimer Layanan',
		slug: 'disclaimer',
		excerpt: 'Batasan tanggung jawab dan cakupan operasional layanan Titipin.',
		body: '<h2>1. Sifat Layanan Perantara Belanja</h2><p>Titipin bertindak sebagai jasa titip pembelian dan pengantaran lokal dari warung, pasar, apotek, maupun toko fisik di sekitar Gatak dan Kartasura. Titipin bukan produsen atau pemilik barang yang diperjualbelikan oleh toko tujuan.</p><h2>2. Ketersediaan dan Kualitas Barang</h2><p>Ketersediaan stok, rasa makanan, masa kedaluwarsa, dan garansi produk sepenuhnya bergantung pada toko atau penjual asal. Kurir akan memeriksa kondisi fisik barang secara wajar saat pembelian sesuai catatan pelanggan.</p><h2>3. Estimasi Waktu dan Jarak</h2><p>Estimasi waktu pengantaran dan perhitungan jarak di sistem bersifat perkiraan operasional dan dapat berubah mengikuti kondisi lalu lintas, antrean toko, atau cuaca di lapangan.</p><h2>4. Barang Terlarang</h2><p>Titipin berhak menolak pesanan yang berkaitan dengan barang ilegal, berbahaya, obat-obatan terlarang tanpa resep sah, atau barang yang melanggar peraturan perundang-undangan di Indonesia.</p>',
		cover_image_url: null,
		status: 'published',
		author_id: null,
		published_at: '2026-11-28T00:00:00.000Z',
		created_at: '2026-11-28T00:00:00.000Z',
		updated_at: '2026-11-28T00:00:00.000Z'
	}
];

function assertAdmin(role: string) {
	if (role !== 'admin') {
		throw new Error('Hanya Admin yang dapat mengelola media, konten, dan promo.');
	}
}

export function slugifyText(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

interface R2Config {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	publicUrl: string;
}

function getR2Config(): R2Config | null {
	const accountId = process.env.R2_ACCOUNT_ID?.trim();
	const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
	const bucketName = process.env.R2_BUCKET_NAME?.trim();
	const publicUrl = process.env.R2_PUBLIC_URL?.trim();

	if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
		return null;
	}

	return {
		accountId,
		accessKeyId,
		secretAccessKey,
		bucketName,
		publicUrl: publicUrl.replace(/\/$/, '')
	};
}

export function isR2Configured(): boolean {
	return getR2Config() !== null;
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
	return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: Buffer | string): string {
	return crypto.createHash('sha256').update(data).digest('hex');
}

async function r2SignedRequest(
	config: R2Config,
	method: 'PUT' | 'DELETE',
	objectKey: string,
	body?: Buffer,
	contentType?: string
): Promise<void> {
	const host = `${config.accountId}.r2.cloudflarestorage.com`;
	const path = `/${config.bucketName}/${objectKey}`;
	const now = new Date();
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
	const dateStamp = amzDate.slice(0, 8);
	const region = 'auto';
	const service = 's3';
	const payloadHash = sha256Hex(body ?? '');

	const headers: Record<string, string> = {
		host,
		'x-amz-content-sha256': payloadHash,
		'x-amz-date': amzDate
	};
	if (contentType) {
		headers['content-type'] = contentType;
	}

	const sortedHeaderKeys = Object.keys(headers).sort();
	const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('');
	const signedHeaders = sortedHeaderKeys.join(';');
	const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

	const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
	const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

	const kDate = hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
	const kRegion = hmacSha256(kDate, region);
	const kService = hmacSha256(kRegion, service);
	const kSigning = hmacSha256(kService, 'aws4_request');
	const signature = hmacSha256(kSigning, stringToSign).toString('hex');

	const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	const fetchHeaders: Record<string, string> = {
		'x-amz-content-sha256': payloadHash,
		'x-amz-date': amzDate,
		Authorization: authorization
	};
	if (contentType) {
		fetchHeaders['content-type'] = contentType;
	}

	const res = await fetch(`https://${host}${path}`, {
		method,
		headers: fetchHeaders,
		body: body ? new Uint8Array(body) : undefined
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(`R2 ${method} gagal (${res.status}): ${errText || res.statusText}`);
	}
}

// ============================================================================
// MEDIA MANAGER
// ============================================================================

export async function getMediaAssets(
	supabase: SupabaseClient<Database> | null
): Promise<MediaAsset[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('media_assets')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(100);
			if (!error && data) return data;
		} catch (err) {
			console.warn('[CMS] Media list fallback:', err);
		}
	}
	return [...fallbackMediaStore].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function uploadMediaAsset(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	input: {
		file: File;
		altText?: string;
	}
): Promise<MediaAsset> {
	assertAdmin(adminRole);

	const { file } = input;
	if (!file || file.size === 0) {
		throw new Error('Pilih file gambar terlebih dahulu.');
	}
	if (!ALLOWED_MEDIA_MIME.has(file.type)) {
		throw new Error('Format file harus JPG, PNG, WebP, atau GIF.');
	}
	if (file.size > MAX_MEDIA_BYTES) {
		throw new Error('Ukuran file maksimal 5 MB.');
	}

	const ext =
		file.name
			.split('.')
			.pop()
			?.toLowerCase()
			.replace(/[^a-z0-9]/g, '') || 'jpg';
	const safeBase = slugifyText(file.name.replace(/\.[^/.]+$/, '')) || 'media';
	const storagePath = `uploads/${Date.now()}-${safeBase}.${ext}`;

	let storageProvider: MediaStorageProvider = 'supabase';
	let publicUrl: string;

	const r2 = getR2Config();
	if (r2) {
		const buffer = Buffer.from(await file.arrayBuffer());
		await r2SignedRequest(r2, 'PUT', storagePath, buffer, file.type);
		storageProvider = 'r2';
		publicUrl = `${r2.publicUrl}/${storagePath}`;
	} else if (supabase) {
		const buffer = await file.arrayBuffer();
		const { error: uploadError } = await supabase.storage
			.from('public-media')
			.upload(storagePath, buffer, {
				contentType: file.type,
				upsert: false
			});

		if (uploadError) {
			throw new Error(`Gagal mengunggah ke bucket public-media: ${uploadError.message}`);
		}

		const { data: urlData } = supabase.storage.from('public-media').getPublicUrl(storagePath);
		publicUrl = urlData.publicUrl;
	} else {
		publicUrl = `https://example.invalid/${storagePath}`;
	}

	const now = new Date().toISOString();
	const rowPayload = {
		file_name: file.name,
		storage_provider: storageProvider,
		storage_path: storagePath,
		public_url: publicUrl,
		mime_type: file.type,
		size_bytes: file.size,
		alt_text: input.altText?.trim() || null,
		uploaded_by: adminId
	};

	if (supabase) {
		const { data, error } = await supabase
			.from('media_assets')
			.insert(rowPayload)
			.select('*')
			.single();

		if (error) {
			throw new Error(`Gagal menyimpan metadata media: ${error.message}`);
		}

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'media.upload',
			target_type: 'media_asset',
			target_id: data.id,
			metadata: { provider: storageProvider, file_name: file.name, size_bytes: file.size }
		});
		return data;
	}

	const synthetic: MediaAsset = {
		id: crypto.randomUUID(),
		...rowPayload,
		created_at: now
	};
	fallbackMediaStore.unshift(synthetic);
	return synthetic;
}

export async function registerExternalMedia(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	input: {
		fileName: string;
		publicUrl: string;
		altText?: string;
	}
): Promise<MediaAsset> {
	assertAdmin(adminRole);

	const fileName = input.fileName.trim();
	const publicUrl = input.publicUrl.trim();
	if (!fileName) {
		throw new Error('Nama aset wajib diisi.');
	}
	if (!/^https:\/\/[^\s]+$/i.test(publicUrl)) {
		throw new Error('URL gambar eksternal harus diawali https://');
	}

	const rowPayload = {
		file_name: fileName,
		storage_provider: 'external' as MediaStorageProvider,
		storage_path: null,
		public_url: publicUrl,
		mime_type: 'image/external',
		size_bytes: 0,
		alt_text: input.altText?.trim() || null,
		uploaded_by: adminId
	};

	if (supabase) {
		const { data, error } = await supabase
			.from('media_assets')
			.insert(rowPayload)
			.select('*')
			.single();

		if (error) {
			throw new Error(`Gagal menyimpan URL media: ${error.message}`);
		}

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'media.register_external',
			target_type: 'media_asset',
			target_id: data.id,
			metadata: { file_name: fileName, public_url: publicUrl }
		});
		return data;
	}

	const synthetic: MediaAsset = {
		id: crypto.randomUUID(),
		...rowPayload,
		created_at: new Date().toISOString()
	};
	fallbackMediaStore.unshift(synthetic);
	return synthetic;
}

export async function deleteMediaAsset(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	assetId: string
): Promise<void> {
	assertAdmin(adminRole);

	if (supabase) {
		const { data: asset } = await supabase
			.from('media_assets')
			.select('*')
			.eq('id', assetId)
			.single();

		if (!asset) {
			throw new Error('Aset media tidak ditemukan.');
		}

		if (asset.storage_provider === 'r2' && asset.storage_path) {
			const r2 = getR2Config();
			if (r2) {
				await r2SignedRequest(r2, 'DELETE', asset.storage_path).catch((err) => {
					console.warn('[CMS] R2 delete warning:', err);
				});
			}
		} else if (asset.storage_provider === 'supabase' && asset.storage_path) {
			await supabase.storage.from('public-media').remove([asset.storage_path]);
		}

		const { error } = await supabase.from('media_assets').delete().eq('id', assetId);
		if (error) {
			throw new Error(`Gagal menghapus aset media: ${error.message}`);
		}

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'media.delete',
			target_type: 'media_asset',
			target_id: assetId,
			metadata: { file_name: asset.file_name }
		});
		return;
	}

	const idx = fallbackMediaStore.findIndex((m) => m.id === assetId);
	if (idx === -1) throw new Error('Aset media tidak ditemukan.');
	fallbackMediaStore.splice(idx, 1);
}

// ============================================================================
// BLOG & STATIC PAGES (CMS)
// ============================================================================

export async function getPublishedContents(
	supabase: SupabaseClient<Database> | null,
	contentType?: CmsContentType
): Promise<CmsContent[]> {
	if (supabase) {
		try {
			let query = supabase
				.from('cms_contents')
				.select('*')
				.eq('status', 'published')
				.order('published_at', { ascending: false });

			if (contentType) {
				query = query.eq('content_type', contentType);
			}

			const { data, error } = await query;
			if (!error && data) {
				if (data.length === 0 && contentType === 'page' && fallbackCmsStore.length === 0) {
					return DEFAULT_LEGAL_PAGES;
				}
				return data;
			}
		} catch (err) {
			console.warn('[CMS] Published contents fallback:', err);
		}
	}

	const fromStore = fallbackCmsStore
		.filter((c) => c.status === 'published' && (!contentType || c.content_type === contentType))
		.sort((a, b) => (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at));
	if (fromStore.length === 0 && contentType === 'page' && fallbackCmsStore.length === 0) {
		return DEFAULT_LEGAL_PAGES;
	}
	return fromStore;
}

export async function getPublishedContentBySlug(
	supabase: SupabaseClient<Database> | null,
	contentType: CmsContentType,
	slug: string
): Promise<CmsContent | null> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('cms_contents')
				.select('*')
				.eq('content_type', contentType)
				.eq('slug', slug)
				.eq('status', 'published')
				.single();
			if (!error && data) return data;
		} catch {
			// fallback below
		}
	}

	const found = fallbackCmsStore.find(
		(c) => c.content_type === contentType && c.slug === slug && c.status === 'published'
	);
	if (found) return found;

	if (contentType === 'page') {
		return DEFAULT_LEGAL_PAGES.find((p) => p.slug === slug) || null;
	}
	return null;
}

export async function getAllContentsForAdmin(
	supabase: SupabaseClient<Database> | null
): Promise<CmsContent[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('cms_contents')
				.select('*')
				.order('updated_at', { ascending: false });
			if (!error && data) return data;
		} catch (err) {
			console.warn('[CMS] Admin contents fallback:', err);
		}
	}
	return [...fallbackCmsStore].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function saveCmsContent(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	input: {
		id?: string;
		contentType: CmsContentType;
		title: string;
		slug?: string;
		excerpt?: string;
		body: string;
		coverImageUrl?: string;
		status: CmsContentStatus;
	}
): Promise<CmsContent> {
	assertAdmin(adminRole);

	const title = input.title.trim();
	const body = input.body.trim();
	if (title.length < 3) throw new Error('Judul minimal 3 karakter.');
	if (body.length < 10) throw new Error('Isi konten minimal 10 karakter.');

	const slug = slugifyText(input.slug?.trim() || title);
	if (!slug) throw new Error('Slug tidak valid.');

	const now = new Date().toISOString();
	const publishedAt = input.status === 'published' ? now : null;

	const payload = {
		content_type: input.contentType,
		title,
		slug,
		excerpt: input.excerpt?.trim() || null,
		body,
		cover_image_url: input.coverImageUrl?.trim() || null,
		status: input.status,
		author_id: adminId,
		updated_at: now
	};

	if (supabase) {
		if (input.id) {
			const { data: existing } = await supabase
				.from('cms_contents')
				.select('published_at')
				.eq('id', input.id)
				.single();

			const { data, error } = await supabase
				.from('cms_contents')
				.update({
					...payload,
					published_at: input.status === 'published' ? existing?.published_at || now : null
				})
				.eq('id', input.id)
				.select('*')
				.single();

			if (error) throw new Error(`Gagal memperbarui konten: ${error.message}`);

			await recordAuditLog(supabase, adminId, adminRole, {
				action: 'cms.update',
				target_type: 'cms_content',
				target_id: data.id,
				metadata: { type: data.content_type, slug: data.slug, status: data.status }
			});
			return data;
		}

		const { data, error } = await supabase
			.from('cms_contents')
			.insert({
				...payload,
				published_at: publishedAt
			})
			.select('*')
			.single();

		if (error) throw new Error(`Gagal membuat konten: ${error.message}`);

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'cms.create',
			target_type: 'cms_content',
			target_id: data.id,
			metadata: { type: data.content_type, slug: data.slug, status: data.status }
		});
		return data;
	}

	if (input.id) {
		const existing = fallbackCmsStore.find((c) => c.id === input.id);
		if (!existing) throw new Error('Konten tidak ditemukan.');
		Object.assign(existing, payload, {
			published_at: input.status === 'published' ? existing.published_at || now : null
		});
		return existing;
	}

	const created: CmsContent = {
		id: crypto.randomUUID(),
		...payload,
		published_at: publishedAt,
		created_at: now
	};
	fallbackCmsStore.unshift(created);
	return created;
}

export async function deleteCmsContent(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	id: string
): Promise<void> {
	assertAdmin(adminRole);

	if (supabase) {
		const { error } = await supabase.from('cms_contents').delete().eq('id', id);
		if (error) throw new Error(`Gagal menghapus konten: ${error.message}`);

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'cms.delete',
			target_type: 'cms_content',
			target_id: id
		});
		return;
	}

	const idx = fallbackCmsStore.findIndex((c) => c.id === id);
	if (idx === -1) throw new Error('Konten tidak ditemukan.');
	fallbackCmsStore.splice(idx, 1);
}

// ============================================================================
// PROMO POPUPS
// ============================================================================

export function isPromoWithinSchedule(promo: PromoPopup, nowMs = Date.now()): boolean {
	if (!promo.is_active) return false;
	if (promo.starts_at && new Date(promo.starts_at).getTime() > nowMs) return false;
	if (promo.ends_at && new Date(promo.ends_at).getTime() < nowMs) return false;
	return true;
}

export async function getActivePromoPopup(
	supabase: SupabaseClient<Database> | null
): Promise<PromoPopup | null> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('promo_popups')
				.select('*')
				.eq('is_active', true)
				.order('updated_at', { ascending: false })
				.limit(10);

			if (!error && data) {
				return data.find((p) => isPromoWithinSchedule(p)) || null;
			}
		} catch (err) {
			console.warn('[CMS] Active promo fallback:', err);
		}
	}

	return fallbackPromoStore.find((p) => isPromoWithinSchedule(p)) || null;
}

export async function getAllPromosForAdmin(
	supabase: SupabaseClient<Database> | null
): Promise<PromoPopup[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('promo_popups')
				.select('*')
				.order('updated_at', { ascending: false });
			if (!error && data) return data;
		} catch (err) {
			console.warn('[CMS] Admin promos fallback:', err);
		}
	}
	return [...fallbackPromoStore].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function savePromoPopup(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	input: {
		id?: string;
		title: string;
		description: string;
		imageUrl?: string;
		ctaLabel?: string;
		ctaHref?: string;
		isActive: boolean;
		startsAt?: string;
		endsAt?: string;
	}
): Promise<PromoPopup> {
	assertAdmin(adminRole);

	const title = input.title.trim();
	const description = input.description.trim();
	if (title.length < 3) throw new Error('Judul promo minimal 3 karakter.');
	if (description.length < 5) throw new Error('Deskripsi promo minimal 5 karakter.');

	const ctaHref = input.ctaHref?.trim() || '/pesan';
	if (!ctaHref.startsWith('/') && !/^https:\/\//i.test(ctaHref)) {
		throw new Error('Link CTA harus path lokal (/...) atau https://...');
	}

	const now = new Date().toISOString();
	const payload = {
		title,
		description,
		image_url: input.imageUrl?.trim() || null,
		cta_label: input.ctaLabel?.trim() || 'Lihat Promo',
		cta_href: ctaHref,
		is_active: input.isActive,
		starts_at: input.startsAt?.trim() ? new Date(input.startsAt).toISOString() : null,
		ends_at: input.endsAt?.trim() ? new Date(input.endsAt).toISOString() : null,
		created_by: adminId,
		updated_at: now
	};

	if (supabase) {
		if (input.id) {
			const { data, error } = await supabase
				.from('promo_popups')
				.update(payload)
				.eq('id', input.id)
				.select('*')
				.single();
			if (error) throw new Error(`Gagal memperbarui promo: ${error.message}`);

			await recordAuditLog(supabase, adminId, adminRole, {
				action: 'promo.update',
				target_type: 'promo_popup',
				target_id: data.id,
				metadata: { title: data.title, is_active: data.is_active }
			});
			return data;
		}

		const { data, error } = await supabase
			.from('promo_popups')
			.insert(payload)
			.select('*')
			.single();
		if (error) throw new Error(`Gagal membuat promo: ${error.message}`);

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'promo.create',
			target_type: 'promo_popup',
			target_id: data.id,
			metadata: { title: data.title, is_active: data.is_active }
		});
		return data;
	}

	if (input.id) {
		const existing = fallbackPromoStore.find((p) => p.id === input.id);
		if (!existing) throw new Error('Promo tidak ditemukan.');
		Object.assign(existing, payload);
		return existing;
	}

	const created: PromoPopup = {
		id: crypto.randomUUID(),
		...payload,
		created_at: now
	};
	fallbackPromoStore.unshift(created);
	return created;
}

export async function deletePromoPopup(
	supabase: SupabaseClient<Database> | null,
	adminId: string,
	adminRole: string,
	id: string
): Promise<void> {
	assertAdmin(adminRole);

	if (supabase) {
		const { error } = await supabase.from('promo_popups').delete().eq('id', id);
		if (error) throw new Error(`Gagal menghapus promo: ${error.message}`);

		await recordAuditLog(supabase, adminId, adminRole, {
			action: 'promo.delete',
			target_type: 'promo_popup',
			target_id: id
		});
		return;
	}

	const idx = fallbackPromoStore.findIndex((p) => p.id === id);
	if (idx === -1) throw new Error('Promo tidak ditemukan.');
	fallbackPromoStore.splice(idx, 1);
}
