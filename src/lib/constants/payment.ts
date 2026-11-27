import type { PaymentMethod, PaymentStatus } from '#lib/types/database.types.js';

export const PAYMENT_STATUS_LABELS: Record<
	PaymentStatus,
	{ label: string; badgeClass: string; description: string }
> = {
	unpaid: {
		label: 'Belum Dibayar',
		badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
		description: 'Menunggu pemilihan metode atau penyelesaian pembayaran.'
	},
	awaiting_verification: {
		label: 'Menunggu Verifikasi',
		badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
		description: 'Bukti atau referensi pembayaran sudah masuk dan menunggu pemeriksaan resmi.'
	},
	verified: {
		label: 'Terverifikasi Lunas',
		badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
		description: 'Pembayaran telah diverifikasi secara manual oleh pengelola/kurir.'
	},
	rejected: {
		label: 'Bukti Ditolak',
		badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
		description: 'Bukti transfer atau nominal tidak sesuai. Silakan kirim ulang bukti yang valid.'
	},
	refunded: {
		label: 'Dana Dikembalikan',
		badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
		description: 'Pembayaran telah dikembalikan kepada pemesan.'
	}
};

export const PAYMENT_METHOD_LABELS: Record<
	PaymentMethod,
	{ label: string; shortLabel: string; instructions: string }
> = {
	cash_on_delivery: {
		label: 'Bayar Tunai di Tempat (COD)',
		shortLabel: 'COD Tunai',
		instructions: 'Bayar tunai langsung saat barang tiba bersama struk kasir fisik asli dari toko.'
	},
	bank_transfer: {
		label: 'Transfer Bank Manual',
		shortLabel: 'Transfer Bank',
		instructions:
			'Lakukan transfer sesuai nominal tagihan ke rekening resmi operasional Titipin (tanyakan detail rekening melalui chat pesanan jika belum tertera), lalu unggah bukti transfer untuk diverifikasi.'
	},
	qris_manual: {
		label: 'QRIS / E-Wallet Manual',
		shortLabel: 'QRIS Manual',
		instructions:
			'Scan QRIS operasional Titipin saat konfirmasi total nota kasir, masukkan ID transaksi, dan unggah tangkapan layar bukti bayar.'
	}
};
