/**
 * Verification Suite for Phase 12: Security Boundaries, Redirect Sanitization & Upload Validation
 * Run: node --experimental-strip-types src/lib/server/security.verify.ts
 */

import assert from 'node:assert/strict';
import { sanitizeRedirectPath } from './auth.ts';
import { validateEvidenceFile, MAX_EVIDENCE_FILE_SIZE_BYTES } from './communication.ts';
import { calculateOrderPricing } from './pricing.ts';

async function runSecurityTests() {
	console.log('--- Running Phase 12 Security & Edge-Case Verification ---');

	// 1. Open Redirect Protection
	assert.equal(sanitizeRedirectPath('/pesanan/TP-12345'), '/pesanan/TP-12345');
	assert.equal(sanitizeRedirectPath('/admin?tab=orders'), '/admin?tab=orders');
	assert.equal(sanitizeRedirectPath('https://evil.com/phish'), '/profil');
	assert.equal(sanitizeRedirectPath('//evil.com/phish'), '/profil');
	assert.equal(sanitizeRedirectPath('/\\evil.com'), '/profil');
	assert.equal(sanitizeRedirectPath('/profil\r\nSet-Cookie: a=b'), '/profil');
	assert.equal(sanitizeRedirectPath(null, '/beranda'), '/beranda');

	// 2. Upload Security Validation (MIME & Size limits)
	assert.equal(validateEvidenceFile('image/jpeg', 1024).valid, true);
	assert.equal(validateEvidenceFile('application/pdf', 2 * 1024 * 1024).valid, true);
	assert.equal(validateEvidenceFile('image/svg+xml', 1024).valid, false, 'SVG must be blocked');
	assert.equal(validateEvidenceFile('text/html', 512).valid, false, 'HTML must be blocked');
	assert.equal(validateEvidenceFile('image/png', 0).valid, false, 'Empty file must be blocked');
	assert.equal(
		validateEvidenceFile('image/png', MAX_EVIDENCE_FILE_SIZE_BYTES + 1).valid,
		false,
		'Oversized file (> 5MB) must be blocked'
	);

	// 3. Pricing Edge Cases (negative values rejected by Zod)
	await assert.rejects(
		() =>
			calculateOrderPricing(null, {
				origin: 'Pasar Gawok',
				destination: 'Blimbing Gatak',
				estimatedItemCost: -5000
			}),
		/negatif|invalid/i,
		'Negative estimatedItemCost must be rejected'
	);

	console.log('All Phase 12 Security & Edge-Case tests PASSED!');
}

runSecurityTests().catch((err) => {
	console.error('Security verification failed:', err);
	process.exit(1);
});
