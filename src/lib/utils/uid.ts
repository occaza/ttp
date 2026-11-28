/**
 * Menghasilkan alias UID numerik 8 digit yang deterministik dari UUID pengguna.
 * Digunakan sebagai identitas ringkas di UI tanpa mengubah UUID asli di database.
 */
export function formatUserUid(uuid: string | null | undefined): string {
	if (!uuid) return '00000000';

	// FNV-1a 32-bit hash untuk distribusi merata dan deterministik
	let hash = 0x811c9dc5;
	for (let i = 0; i < uuid.length; i++) {
		hash ^= uuid.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}

	const unsigned = hash >>> 0;
	const eightDigit = 10_000_000 + (unsigned % 90_000_000);
	return String(eightDigit);
}
