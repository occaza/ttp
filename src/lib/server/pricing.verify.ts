import {
	calculatePricingBreakdown,
	pricingInputSchema,
	DEFAULT_GATAK_PRICING_RULES,
	calculateOrderPricing
} from './pricing.ts';
import { defaultDistanceProvider } from './distance.ts';

async function runPricingVerification() {
	console.log('Testing Phase 6 Pricing Engine Calculations & Abstractions...');

	// 1. Test Fixed Fee Model
	const fixedRule = DEFAULT_GATAK_PRICING_RULES['gatak-flat'];
	const mockDistance1 = {
		distanceKm: 2.0,
		durationMinutes: 10,
		isMock: true,
		source: 'local_matrix_mock' as const,
		providerNotes: 'mock'
	};

	const fixedResult = calculatePricingBreakdown(fixedRule, mockDistance1, {
		origin: 'Gawok',
		destination: 'Krapyak, Gatak',
		estimatedItemCost: 25000,
		additionalApprovedFees: [],
		discountAmount: 0
	});

	if (fixedResult.summary.serviceFee !== 8000) {
		throw new Error(`Expected fixed service fee 8000, got ${fixedResult.summary.serviceFee}`);
	}
	if (fixedResult.summary.platformFee !== 1000) {
		throw new Error(`Expected platform fee 1000, got ${fixedResult.summary.platformFee}`);
	}
	if (fixedResult.summary.totalJastipFee !== 9000) {
		throw new Error(`Expected total jastip 9000, got ${fixedResult.summary.totalJastipFee}`);
	}
	if (fixedResult.summary.grandTotalEstimate !== 34000) {
		throw new Error(`Expected grand total 34000, got ${fixedResult.summary.grandTotalEstimate}`);
	}
	console.log('✔ Model 1 (Fixed Fee) Calculation Passed');

	// 2. Test Distance-based Model - Within Base Distance
	const distRule = DEFAULT_GATAK_PRICING_RULES['gatak-distance'];
	const withinBaseDistance = {
		distanceKm: 2.0,
		durationMinutes: 10,
		isMock: true,
		source: 'haversine_mock' as const,
		providerNotes: 'mock'
	};

	const distWithinResult = calculatePricingBreakdown(distRule, withinBaseDistance, {
		origin: 'Gatak',
		destination: 'Gawok',
		estimatedItemCost: 0,
		additionalApprovedFees: [],
		discountAmount: 0
	});

	if (distWithinResult.summary.distanceSurcharge !== 0) {
		throw new Error(
			`Expected 0 surcharge for 2.0 km within 2.5 km base, got ${distWithinResult.summary.distanceSurcharge}`
		);
	}
	if (distWithinResult.summary.totalJastipFee !== 8000) {
		// 7000 base + 1000 platform
		throw new Error(
			`Expected 8000 total jastip fee, got ${distWithinResult.summary.totalJastipFee}`
		);
	}
	console.log('✔ Model 2A (Distance-based Within Base Distance) Calculation Passed');

	// 3. Test Distance-based Model - Beyond Base Distance
	const beyondBaseDistance = {
		distanceKm: 5.0, // 5.0 km - 2.5 km base = 2.5 km extra * 2000 = 5000 surcharge
		durationMinutes: 20,
		isMock: true,
		source: 'haversine_mock' as const,
		providerNotes: 'mock'
	};

	const distBeyondResult = calculatePricingBreakdown(distRule, beyondBaseDistance, {
		origin: 'Gatak',
		destination: 'Kartasura',
		estimatedItemCost: 0,
		additionalApprovedFees: [],
		discountAmount: 0
	});

	if (distBeyondResult.summary.distanceSurcharge !== 5000) {
		throw new Error(
			`Expected 5000 distance surcharge, got ${distBeyondResult.summary.distanceSurcharge}`
		);
	}
	// 7000 base + 5000 surcharge + 1000 platform = 13000
	if (distBeyondResult.summary.totalJastipFee !== 13000) {
		throw new Error(
			`Expected 13000 total jastip fee, got ${distBeyondResult.summary.totalJastipFee}`
		);
	}
	console.log('✔ Model 2B (Distance-based Beyond Base Distance) Calculation Passed');

	// 4. Test Shopping + Delivery Model
	const shoppingRule = DEFAULT_GATAK_PRICING_RULES['gatak-shopping-delivery'];
	const shoppingDistance = {
		distanceKm: 4.0, // base 3.0 km -> 1.0 km extra * 2000 = 2000 surcharge
		durationMinutes: 18,
		isMock: true,
		source: 'haversine_mock' as const,
		providerNotes: 'mock'
	};

	const shoppingResult = calculatePricingBreakdown(shoppingRule, shoppingDistance, {
		origin: 'Pasar Gawok',
		destination: 'Luwang, Gatak',
		estimatedItemCost: 50000,
		additionalApprovedFees: [],
		discountAmount: 0
	});

	// Service fee 8000 + Delivery 5000 + Surcharge 2000 + Platform 1000 = 16000 jastip fee
	if (shoppingResult.summary.serviceFee !== 8000) {
		throw new Error(`Expected shopping service fee 8000, got ${shoppingResult.summary.serviceFee}`);
	}
	if (shoppingResult.summary.deliveryFee !== 5000) {
		throw new Error(`Expected delivery fee 5000, got ${shoppingResult.summary.deliveryFee}`);
	}
	if (shoppingResult.summary.distanceSurcharge !== 2000) {
		throw new Error(
			`Expected distance surcharge 2000, got ${shoppingResult.summary.distanceSurcharge}`
		);
	}
	if (shoppingResult.summary.totalJastipFee !== 16000) {
		throw new Error(
			`Expected 16000 total jastip fee, got ${shoppingResult.summary.totalJastipFee}`
		);
	}
	if (shoppingResult.summary.grandTotalEstimate !== 66000) {
		// 16000 + 50000
		throw new Error(`Expected 66000 grand total, got ${shoppingResult.summary.grandTotalEstimate}`);
	}
	console.log('✔ Model 3 (Shopping + Delivery Multi-Item) Calculation Passed');

	// 5. Test Additional Approved Fees and Discounts
	const extraResult = calculatePricingBreakdown(fixedRule, mockDistance1, {
		origin: 'Gawok',
		destination: 'Trangsan',
		estimatedItemCost: 20000,
		additionalApprovedFees: [
			{ label: 'Parkir Resmi Pasar', amount: 2000, notes: 'Struk karcis parkir' }
		],
		discountAmount: 3000
	});

	// 8000 service + 1000 platform + 2000 parking - 3000 discount = 8000 total jastip
	if (extraResult.summary.additionalFees !== 2000) {
		throw new Error(`Expected additional fees 2000, got ${extraResult.summary.additionalFees}`);
	}
	if (extraResult.summary.discount !== 3000) {
		throw new Error(`Expected discount 3000, got ${extraResult.summary.discount}`);
	}
	if (extraResult.summary.totalJastipFee !== 8000) {
		throw new Error(`Expected total jastip 8000, got ${extraResult.summary.totalJastipFee}`);
	}
	console.log('✔ Additional Fees & Discount Handling Passed');

	// 6. Test Distance Provider & Safe Mock Indicator
	const distCheck = await defaultDistanceProvider.calculateDistance('Gatak', 'Kartasura');
	if (distCheck.isMock !== true) {
		throw new Error('Distance provider must clearly mark development estimates as isMock: true');
	}
	if (distCheck.distanceKm <= 0) {
		throw new Error('Distance must be positive');
	}
	console.log(
		`✔ Distance Provider Abstraction Passed (Computed ${distCheck.distanceKm} km, isMock: ${distCheck.isMock})`
	);

	// 7. Test Zod Validation Schema
	const validParsed = pricingInputSchema.safeParse({
		origin: 'Warung Soto Gawok',
		destination: 'Mayang, Gatak',
		estimatedItemCost: 15000
	});
	if (!validParsed.success) {
		throw new Error('Valid pricing input rejected');
	}

	const invalidNegative = pricingInputSchema.safeParse({
		origin: 'Gatak',
		destination: 'Kartasura',
		estimatedItemCost: -1000 // Negative not allowed
	});
	if (invalidNegative.success) {
		throw new Error('Negative estimated item cost must be rejected');
	}

	const emptyOrigin = pricingInputSchema.safeParse({
		origin: '',
		destination: 'Gatak'
	});
	if (emptyOrigin.success) {
		throw new Error('Empty origin must be rejected');
	}
	console.log('✔ Zod Input Validation Schema Passed');

	// 8. Test calculateOrderPricing full flow
	const fullPricing = await calculateOrderPricing(null, {
		origin: 'Gatak (Pusat)',
		destination: 'Gawok & Blimbing',
		estimatedItemCost: 35000,
		ruleId: 'gatak-flat'
	});
	if (!fullPricing.calculatedAt || !fullPricing.lineItems || fullPricing.lineItems.length === 0) {
		throw new Error('Pricing snapshot is missing lineItems or timestamp');
	}
	console.log('✔ Full Server-side Pricing Flow Passed');

	console.log('\nAll Phase 6 Pricing Engine verifications succeeded cleanly!');
}

runPricingVerification().catch((err) => {
	console.error('❌ Pricing verification failed:', err);
	process.exit(1);
});
