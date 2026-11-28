import assert from 'node:assert/strict';
import {
	deleteCmsContent,
	deleteMediaAsset,
	deletePromoPopup,
	getActivePromoPopup,
	getAllContentsForAdmin,
	getMediaAssets,
	getPublishedContentBySlug,
	getPublishedContents,
	isPromoWithinSchedule,
	registerExternalMedia,
	saveCmsContent,
	savePromoPopup,
	slugifyText
} from './cms.ts';
import { renderMarkdownToHtml } from '../utils/markdown.ts';

async function runTests() {
	console.log('--- Running CMS, Media Manager & Promo Popup Verification ---');

	// 1. Slugify & Markdown XSS guard
	assert.equal(slugifyText('Syarat & Ketentuan Layanan!'), 'syarat-ketentuan-layanan');
	const rendered = renderMarkdownToHtml(
		'# Judul\n\nParagraf **tebal** dan <script>alert(1)</script>\n\n- Poin 1\n- [Link](https://titipin.test)'
	);
	assert.ok(rendered.includes('<h2'));
	assert.ok(rendered.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
	assert.ok(!rendered.includes('<script>'));
	assert.ok(rendered.includes('<a href="https://titipin.test"'));
	console.log('✔ Slugify & XSS-safe Markdown renderer passed');

	// 2. Role guard
	await assert.rejects(
		() =>
			registerExternalMedia(null, 'user-1', 'customer', {
				fileName: 'test.jpg',
				publicUrl: 'https://cdn.example.com/test.jpg'
			}),
		/Hanya Admin/
	);
	console.log('✔ Admin role guard passed');

	// 3. External Media registration & deletion
	const asset = await registerExternalMedia(null, 'admin-1', 'admin', {
		fileName: 'banner-promo.webp',
		publicUrl: 'https://cdn.example.com/banner-promo.webp',
		altText: 'Banner Promo'
	});
	assert.equal(asset.storage_provider, 'external');
	assert.equal((await getMediaAssets(null)).length, 1);
	await deleteMediaAsset(null, 'admin-1', 'admin', asset.id);
	assert.equal((await getMediaAssets(null)).length, 0);
	console.log('✔ Media Manager external URL & delete passed');

	// 4. CMS Blog Post & Static Page CRUD + draft visibility
	const draftPost = await saveCmsContent(null, 'admin-1', 'admin', {
		contentType: 'post',
		title: 'Draft Artikel',
		body: 'Isi artikel masih dalam tahap penulisan.',
		status: 'draft'
	});
	assert.equal(await getPublishedContentBySlug(null, 'post', draftPost.slug), null);

	const publishedPage = await saveCmsContent(null, 'admin-1', 'admin', {
		contentType: 'page',
		title: 'Syarat dan Ketentuan',
		slug: 'syarat-ketentuan',
		body: 'Ketentuan penggunaan layanan Titipin di Gatak.',
		status: 'published'
	});
	const fetchedPage = await getPublishedContentBySlug(null, 'page', 'syarat-ketentuan');
	assert.equal(fetchedPage?.id, publishedPage.id);
	assert.equal((await getPublishedContents(null, 'page')).length, 1);
	assert.equal((await getAllContentsForAdmin(null)).length, 2);

	await deleteCmsContent(null, 'admin-1', 'admin', draftPost.id);
	await deleteCmsContent(null, 'admin-1', 'admin', publishedPage.id);
	console.log('✔ CMS Blog & Static Page CRUD + visibility passed');

	// 5. Promo Popup scheduling & active state
	const activePromo = await savePromoPopup(null, 'admin-1', 'admin', {
		title: 'Promo Hemat Gatak',
		description: 'Potongan ongkos jastip untuk pesanan pertama.',
		ctaLabel: 'Pesan Sekarang',
		ctaHref: '/pesan',
		isActive: true
	});
	assert.equal((await getActivePromoPopup(null))?.id, activePromo.id);

	const futurePromo = {
		...activePromo,
		starts_at: new Date(Date.now() + 86_400_000).toISOString()
	};
	assert.equal(isPromoWithinSchedule(futurePromo), false);

	await deletePromoPopup(null, 'admin-1', 'admin', activePromo.id);
	assert.equal(await getActivePromoPopup(null), null);
	console.log('✔ Promo Popup scheduling & CRUD passed');

	console.log('All CMS, Media Manager & Promo Popup tests PASSED!');
}

runTests().catch((err) => {
	console.error(err);
	process.exit(1);
});
