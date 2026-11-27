import type { OrderStatus } from '#lib/types/database.types.js';

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; badgeClass: string }> = {
	pending: {
		label: 'Menunggu Konfirmasi',
		badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
	},
	accepted: {
		label: 'Pesanan Diterima',
		badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
	},
	shopping: {
		label: 'Sedang Dibelikan',
		badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
	},
	purchased: {
		label: 'Belanja Selesai (Nota Kasir Ada)',
		badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
	},
	delivering: {
		label: 'Sedang Diantar ke Alamat',
		badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20'
	},
	completed: {
		label: 'Pesanan Selesai',
		badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
	},
	cancelled: {
		label: 'Dibatalkan',
		badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
	},
	rejected: {
		label: 'Ditolak',
		badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20'
	}
};

/**
 * Strip legacy "Name (Phone) - " prefix from stored destination_address_text
 * so recipient name and phone are not duplicated next to the address.
 */
export function formatCleanAddress(addressText: string): string {
	return addressText.replace(/^[^-()]+?\(\+?[0-9\s-]{6,}\)\s*-\s*/i, '').trim();
}
