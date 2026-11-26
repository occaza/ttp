/**
 * Titipin - Distance Provider Abstraction
 *
 * Safely computes route distance between merchant/origin and delivery address.
 * Conforms to Phase 6 requirements:
 * "If route-distance provider is not configured, create a safe abstraction
 * and clearly marked development-only mock, never present mock values as real estimates."
 */

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export interface DistanceCalculationResult {
	distanceKm: number;
	durationMinutes: number;
	isMock: boolean;
	source: 'osrm' | 'google_maps' | 'haversine_mock' | 'local_matrix_mock';
	providerNotes: string;
}

export interface DistanceProvider {
	calculateDistance(
		origin: Coordinates | string,
		destination: Coordinates | string
	): Promise<DistanceCalculationResult>;
}

// Known coordinates in Kecamatan Gatak and surrounding Solo Raya areas
export const KNOWN_AREA_COORDINATES: Record<string, Coordinates> = {
	gatak: { latitude: -7.5878, longitude: 110.7412 },
	'gatak (pusat)': { latitude: -7.5878, longitude: 110.7412 },
	gawok: { latitude: -7.5954, longitude: 110.7321 },
	'gawok & blimbing': { latitude: -7.5954, longitude: 110.7321 },
	blimbing: { latitude: -7.6012, longitude: 110.7345 },
	trangsan: { latitude: -7.5789, longitude: 110.749 },
	'trangsan & luwang': { latitude: -7.5789, longitude: 110.749 },
	luwang: { latitude: -7.5823, longitude: 110.7512 },
	mayang: { latitude: -7.5712, longitude: 110.7389 },
	'mayang & sanggung': { latitude: -7.5712, longitude: 110.7389 },
	sanggung: { latitude: -7.5654, longitude: 110.734 },
	kartasura: { latitude: -7.5512, longitude: 110.7456 },
	'kartasura & ums': { latitude: -7.5512, longitude: 110.7456 },
	ums: { latitude: -7.5578, longitude: 110.7712 },
	baki: { latitude: -7.6089, longitude: 110.7789 },
	'baki & gentan': { latitude: -7.6089, longitude: 110.7789 },
	gentan: { latitude: -7.5945, longitude: 110.7856 },
	sawit: { latitude: -7.6123, longitude: 110.7189 },
	'sawit & sekitarnya': { latitude: -7.6123, longitude: 110.7189 }
};

// Haversine formula calculation for geodesic distance
export function calculateHaversineDistanceKm(c1: Coordinates, c2: Coordinates): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
	const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
	const lat1 = (c1.latitude * Math.PI) / 180;
	const lat2 = (c2.latitude * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const straightLineKm = R * c;

	// In local road networks, real road distance is typically ~1.3x to 1.4x of geodesic distance
	const estimatedRoadDistance = Math.max(0.5, Math.round(straightLineKm * 1.35 * 10) / 10);
	return estimatedRoadDistance;
}

function resolveCoordinates(input: Coordinates | string): Coordinates | null {
	if (typeof input === 'object' && input !== null) {
		if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
			return input;
		}
	}

	if (typeof input === 'string') {
		const normalized = input.trim().toLowerCase();
		for (const [key, coords] of Object.entries(KNOWN_AREA_COORDINATES)) {
			if (normalized.includes(key) || key.includes(normalized)) {
				return coords;
			}
		}
	}

	return null;
}

/**
 * Safe local development distance provider.
 * When real routing APIs (e.g. OSRM or Google Maps) are absent or in development mode,
 * this provider clearly marks results with `isMock: true`.
 */
export class SafeLocalDistanceProvider implements DistanceProvider {
	calculateDistance(
		origin: Coordinates | string,
		destination: Coordinates | string
	): Promise<DistanceCalculationResult> {
		const originCoords = resolveCoordinates(origin);
		const destCoords = resolveCoordinates(destination);

		if (!originCoords || !destCoords) {
			// Safe default for within Gatak neighborhood (2.0 km)
			return Promise.resolve({
				distanceKm: 2.0,
				durationMinutes: 10,
				isMock: true,
				source: 'local_matrix_mock',
				providerNotes:
					'[DEV-ONLY MOCK] Estimasi jarak default area lokal (2.0 km). Provider routing eksternal belum dikonfigurasi.'
			});
		}

		const distanceKm = calculateHaversineDistanceKm(originCoords, destCoords);
		// Estimate 3 minutes per km for motorbike in local roads + 5 mins buffer
		const durationMinutes = Math.round(distanceKm * 3) + 5;

		return Promise.resolve({
			distanceKm,
			durationMinutes,
			isMock: true,
			source: 'haversine_mock',
			providerNotes: `[DEV-ONLY MOCK] Perhitungan jarak estimasi jalan lokal (${distanceKm} km). Tidak menggunakan routing GPS live.`
		});
	}
}

// Global default distance provider instance
export const defaultDistanceProvider = new SafeLocalDistanceProvider();
