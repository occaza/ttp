import {
	validateEvidenceFile,
	sendMessageSchema,
	sendOrderMessage,
	getOrderMessages,
	uploadOrderEvidence,
	getOrderAttachments,
	createNotification,
	getUserNotifications,
	getUnreadNotificationCount,
	markNotificationRead,
	markAllNotificationsRead,
	MAX_EVIDENCE_FILE_SIZE_BYTES
} from './communication.ts';

async function runCommunicationVerification() {
	console.log('Testing Phase 8 Chat, Evidence Validation & Notifications...');

	// 1. Test File Validation Rules
	const validJpeg = validateEvidenceFile('image/jpeg', 1024 * 500);
	if (!validJpeg.valid) throw new Error('Valid JPEG should pass');

	const validPdf = validateEvidenceFile('application/pdf', 1024 * 1024);
	if (!validPdf.valid) throw new Error('Valid PDF should pass');

	const invalidMime = validateEvidenceFile('application/x-msdownload', 1024);
	if (invalidMime.valid) throw new Error('Executable mime type must be rejected');

	const tooLarge = validateEvidenceFile('image/png', MAX_EVIDENCE_FILE_SIZE_BYTES + 1);
	if (tooLarge.valid) throw new Error('File larger than 5MB must be rejected');

	const emptyFile = validateEvidenceFile('image/png', 0);
	if (emptyFile.valid) throw new Error('0-byte file must be rejected');

	console.log('✔ Evidence File Validation Rules Passed');

	// 2. Test Message Schema Validation
	const emptyMsg = sendMessageSchema.safeParse({ order_id: 'ord-1', message: '   ' });
	if (emptyMsg.success) throw new Error('Empty message must be rejected');

	const longMsg = sendMessageSchema.safeParse({ order_id: 'ord-1', message: 'a'.repeat(1001) });
	if (longMsg.success) throw new Error('Message > 1000 chars must be rejected');

	const validMsg = sendMessageSchema.safeParse({
		order_id: 'ord-1',
		message: 'Tolong sambalnya dipisah ya.'
	});
	if (!validMsg.success) throw new Error('Valid message should pass');

	console.log('✔ Chat Message Schema Validation Passed');

	// 3. Test Order-Scoped Chat & System Timeline Messages
	const orderId = 'order-test-phase8';
	await sendOrderMessage(null, {
		orderId,
		senderId: null,
		senderRole: 'system',
		message: 'Pesanan dibuat.',
		isSystem: true
	});
	await sendOrderMessage(null, {
		orderId,
		senderId: 'cust-1',
		senderRole: 'customer',
		message: 'Apakah warungnya masih buka?'
	});
	await sendOrderMessage(null, {
		orderId,
		senderId: 'owner-titipin',
		senderRole: 'provider',
		message: 'Masih buka, saya sudah di lokasi.'
	});

	const messages = await getOrderMessages(null, orderId);
	if (messages.length !== 3) throw new Error(`Expected 3 messages, got ${messages.length}`);
	if (!messages[0].is_system) throw new Error('First message must be marked as system');
	console.log('✔ Order-Scoped Chat & System Messages Passed');

	// 4. Test Evidence Upload Flow
	const att = await uploadOrderEvidence(null, {
		orderId,
		uploaderId: 'owner-titipin',
		attachmentType: 'receipt',
		fileName: 'struk-soto-gawok.jpg',
		mimeType: 'image/jpeg',
		fileSize: 250000,
		note: 'Nota kasir asli Rp 32.000'
	});
	if (!att.file_path.startsWith(`${orderId}/`)) {
		throw new Error('Attachment storage path must be scoped to orderId');
	}
	const attachments = await getOrderAttachments(null, orderId);
	if (attachments.length !== 1) throw new Error('Expected 1 attachment');
	console.log('✔ Evidence Upload & Retrieval Passed');

	// 5. Test Notifications Flow & Read/Unread Tracking
	const userId = 'cust-notif-1';
	const n1 = await createNotification(null, {
		userId,
		orderId,
		title: 'Struk Diunggah',
		body: 'Nota kasir toko sudah diunggah.',
		type: 'evidence_uploaded'
	});
	await createNotification(null, {
		userId,
		orderId,
		title: 'Pesan Baru',
		body: 'Ada pesan baru di pesanan Anda.',
		type: 'chat_message'
	});

	const unreadBefore = await getUnreadNotificationCount(null, userId);
	if (unreadBefore !== 2) throw new Error(`Expected 2 unread, got ${unreadBefore}`);

	await markNotificationRead(null, userId, n1.id);
	const unreadAfterOne = await getUnreadNotificationCount(null, userId);
	if (unreadAfterOne !== 1) throw new Error(`Expected 1 unread, got ${unreadAfterOne}`);

	await markAllNotificationsRead(null, userId);
	const unreadAfterAll = await getUnreadNotificationCount(null, userId);
	if (unreadAfterAll !== 0) throw new Error(`Expected 0 unread, got ${unreadAfterAll}`);

	const allNotifs = await getUserNotifications(null, userId);
	if (allNotifs.length !== 2) throw new Error('Expected 2 notifications in inbox');
	console.log('✔ Notifications Creation & Read State Passed');

	console.log('\nAll Phase 8 Communication & Evidence tests passed cleanly!');
}

runCommunicationVerification().catch((err) => {
	console.error('❌ Communication verification failed:', err);
	process.exit(1);
});
