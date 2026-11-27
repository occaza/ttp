<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import type { PricingSnapshot } from '#lib/server/pricing.js';
	import type { PaymentMethod } from '#lib/types/database.types.js';
	import {
		AlertCircle,
		ArrowLeft,
		CheckCircle2,
		FileText,
		MessageSquare,
		Send,
		Upload
	} from 'lucide-svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const o = $derived(data.order);
	const statusMeta = $derived(
		ORDER_STATUS_LABELS[o.status] || {
			label: o.status,
			badgeClass: 'bg-muted text-muted-foreground'
		}
	);

	const pricingSnapshot = $derived(o.pricing_snapshot as unknown as PricingSnapshot);
	const orderFlow = ['pending', 'accepted', 'shopping', 'purchased', 'delivering', 'completed'];
	const currentStepIndex = $derived(orderFlow.indexOf(o.status));
	const progressPercent = $derived(
		currentStepIndex <= 0 ? 10 : Math.round(((currentStepIndex + 1) / orderFlow.length) * 100)
	);

	const waUrl = $derived.by(() => {
		const msg = encodeURIComponent(
			`Halo Titipin, saya ingin menanyakan pesanan ${o.order_number} (${o.origin_name}).`
		);
		return `https://wa.me/628161666202?text=${msg}`;
	});

	// Cancel inline disclosure
	let isCancelling = $state(false);
	let showCancelInline = $state(false);
	let cancelReason = $state('Salah tulis menu / berubah pikiran');

	// Chat & Evidence state
	let chatInput = $state('');
	let sendingChat = $state(false);
	let uploadingEvidence = $state(false);
	let attachmentType = $state<'receipt' | 'delivery_proof' | 'chat_image'>('receipt');
	let evidenceNote = $state('');

	// Payment state
	const p = $derived(data.payment);
	const paymentStatusMeta = $derived(
		p ? PAYMENT_STATUS_LABELS[p.status] : PAYMENT_STATUS_LABELS.unpaid
	);
	const expectedTotalAmount = $derived(Number(o.actual_total || o.total_estimated || 0));

	let selectedMethod = $state<PaymentMethod>('cash_on_delivery');
	let payerName = $state('');
	let paymentExternalRef = $state('');
	let submittingPayment = $state(false);

	let verifyAmount = $state('');
	let rejectReason = $state('');
	let refundNote = $state('');
	let processingPrivilegePayment = $state(false);

	$effect(() => {
		if (p) {
			selectedMethod = p.method;
			payerName = p.payer_name || '';
			paymentExternalRef = p.external_reference || '';
		} else {
			selectedMethod = 'cash_on_delivery';
			payerName = o.recipient_name || '';
		}
		verifyAmount = String(expectedTotalAmount);
	});
</script>

<svelte:head>
	<title>Pesanan {o.order_number} - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
	<!-- Back & Timestamp -->
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<a
			href={resolve('/pesanan')}
			class="inline-flex items-center gap-1.5 font-semibold transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<ArrowLeft class="size-3.5" />
			<span>Semua Pesanan</span>
		</a>

		<span class="tabular-nums">
			{new Date(o.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			})}
		</span>
	</div>

	{#if form?.error}
		<div
			role="alert"
			class="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.cancelSuccess}
		<div
			role="status"
			class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.cancelSuccess}</span>
		</div>
	{/if}

	<!-- 1. Order Identity & Progress -->
	<header class="space-y-3 pb-1">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h1 class="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
				{o.order_number}
			</h1>
			<div class="flex flex-wrap items-center gap-1.5">
				<span
					class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {statusMeta.badgeClass}"
				>
					{statusMeta.label}
				</span>
				<span
					class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {paymentStatusMeta.badgeClass}"
				>
					{paymentStatusMeta.label}
				</span>
			</div>
		</div>

		{#if o.status !== 'cancelled' && o.status !== 'rejected'}
			<div class="space-y-1.5">
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-primary transition-all duration-200"
						style="width: {progressPercent}%"
					></div>
				</div>
				<p class="text-xs text-muted-foreground tabular-nums">
					Tahap {Math.max(1, currentStepIndex + 1)} dari {orderFlow.length} &middot; {statusMeta.label}
				</p>
			</div>
		{:else}
			<div
				class="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-200"
			>
				<div>
					<p class="font-bold">Pesanan {o.status === 'cancelled' ? 'Dibatalkan' : 'Ditolak'}</p>
					{#if o.cancellation_reason}
						<p class="mt-0.5 text-[11px] opacity-90">{o.cancellation_reason}</p>
					{/if}
				</div>
				<Button href={resolve('/pesan')} size="sm" variant="outline" class="h-8 shrink-0 text-xs">
					Pesan Lagi
				</Button>
			</div>
		{/if}
	</header>

	<!-- 2. Ringkasan Pesanan & Biaya (Single Source of Truth) -->
	<section class="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card shadow-xs">
		<!-- Route -->
		<div class="space-y-2.5 p-5 text-xs">
			<div class="flex items-baseline justify-between gap-4">
				<span class="w-16 shrink-0 text-muted-foreground">Beli di</span>
				<span class="flex-1 text-right font-semibold text-foreground">{o.origin_name}</span>
			</div>
			<div class="flex items-baseline justify-between gap-4">
				<span class="w-16 shrink-0 text-muted-foreground">Antar ke</span>
				<div class="flex-1 text-right">
					<p class="font-semibold text-foreground">{o.destination_address_text}</p>
					<p class="text-[11px] text-muted-foreground tabular-nums">
						{o.recipient_name} &middot; {o.recipient_phone}
					</p>
				</div>
			</div>
			{#if o.customer_notes}
				<p class="pt-1 text-[11px] text-muted-foreground italic">
					Catatan: {o.customer_notes}
				</p>
			{/if}
		</div>

		<!-- Items -->
		<div class="p-5">
			<h2 class="mb-2.5 text-xs font-bold text-foreground">
				Daftar Belanja ({o.items.length})
			</h2>
			<div class="divide-y divide-border/40">
				{#each o.items as it (it.id)}
					<div class="flex items-baseline justify-between gap-3 py-2 text-xs">
						<div>
							<span class="font-medium text-foreground">{it.name}</span>
							<span class="ml-1 text-muted-foreground tabular-nums">
								&times; {it.quantity}
								{it.unit}
							</span>
							{#if it.notes}
								<p class="text-[11px] text-muted-foreground">{it.notes}</p>
							{/if}
						</div>
						{#if it.estimated_price}
							<span class="shrink-0 font-medium text-foreground tabular-nums">
								Rp {Number(it.estimated_price * it.quantity).toLocaleString('id-ID')}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Pricing Total -->
		<div class="space-y-2 p-5 text-xs">
			{#if pricingSnapshot?.lineItems}
				{#each pricingSnapshot.lineItems as li (li.code)}
					<div class="flex items-baseline justify-between">
						<span class="text-muted-foreground">{li.label}</span>
						<span class="text-foreground tabular-nums">
							Rp {Number(li.amount).toLocaleString('id-ID')}
						</span>
					</div>
				{/each}
			{:else}
				<div class="flex items-baseline justify-between">
					<span class="text-muted-foreground">Tarif Jastip</span>
					<span class="text-foreground tabular-nums">
						Rp {Number(o.jastip_fee).toLocaleString('id-ID')}
					</span>
				</div>
			{/if}

			<div
				class="flex items-baseline justify-between border-t border-dashed border-border pt-2.5 text-sm font-bold"
			>
				<span class="text-foreground">{o.actual_total ? 'Total Nota' : 'Total Estimasi'}</span>
				<span class="text-base text-primary tabular-nums">
					Rp {expectedTotalAmount.toLocaleString('id-ID')}
				</span>
			</div>
		</div>
	</section>

	<!-- 3. Pembayaran -->
	<section class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
		<div class="flex items-center justify-between gap-2">
			<div>
				<h2 class="text-sm font-bold text-foreground">Pembayaran</h2>
				{#if p?.payment_reference}
					<p class="font-mono text-[11px] text-muted-foreground tabular-nums">
						{p.payment_reference} &middot; {PAYMENT_METHOD_LABELS[p.method].shortLabel}
					</p>
				{/if}
			</div>
			<span
				class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {paymentStatusMeta.badgeClass}"
			>
				{paymentStatusMeta.label}
			</span>
		</div>

		{#if form?.paymentError}
			<div
				role="alert"
				class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{form.paymentError}</span>
			</div>
		{/if}

		{#if form?.paymentSuccess}
			<div
				role="status"
				class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			>
				<CheckCircle2 class="size-4 shrink-0" />
				<span>{form.paymentSuccess}</span>
			</div>
		{/if}

		{#if p?.status === 'awaiting_verification'}
			<p class="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
				Bukti pembayaran sudah masuk dan sedang menunggu verifikasi manual dari admin atau kurir.
			</p>
		{:else if p?.status === 'rejected' && p.rejection_reason}
			<p class="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-900 dark:text-rose-200">
				<strong>Ditolak:</strong>
				{p.rejection_reason}
			</p>
		{:else if p?.status === 'verified' && p.verified_at}
			<p class="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200">
				Lunas Rp {Number(p.paid_amount ?? expectedTotalAmount).toLocaleString('id-ID')} pada
				<span class="tabular-nums">{new Date(p.verified_at).toLocaleString('id-ID')}</span>.
			</p>
		{/if}

		{#if p?.proofSignedUrl && p.proof_mime_type?.startsWith('image/')}
			<img
				src={p.proofSignedUrl}
				alt={p.proof_file_name || 'Bukti pembayaran'}
				class="max-h-48 w-full rounded-xl border border-border/60 bg-muted/20 object-contain"
			/>
		{/if}

		<!-- Customer Payment Action -->
		{#if (!p || (p.status !== 'verified' && p.status !== 'refunded')) && (data.isCustomer || data.isAdmin)}
			<form
				method="POST"
				action="?/submitPayment"
				enctype="multipart/form-data"
				use:enhance={() => {
					submittingPayment = true;
					return async ({ update }) => {
						submittingPayment = false;
						await update();
					};
				}}
				class="space-y-3 border-t border-border/50 pt-3.5"
			>
				<div class="grid grid-cols-3 gap-2">
					{#each Object.entries(PAYMENT_METHOD_LABELS) as [mKey, mMeta] (mKey)}
						<label
							class="flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-center text-xs transition-colors duration-150 {selectedMethod ===
							mKey
								? 'border-primary bg-primary/10 font-bold text-primary'
								: 'border-border/70 text-muted-foreground hover:bg-muted/30 hover:text-foreground'}"
						>
							<input
								type="radio"
								name="method"
								value={mKey}
								bind:group={selectedMethod}
								class="sr-only"
							/>
							<span>{mMeta.shortLabel}</span>
						</label>
					{/each}
				</div>

				{#if selectedMethod === 'cash_on_delivery'}
					<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-xs text-muted-foreground">
							Bayar tunai langsung saat barang tiba sesuai struk kasir asli.
						</p>
						<Button
							type="submit"
							size="sm"
							disabled={submittingPayment}
							class="h-9 shrink-0 text-xs font-bold"
						>
							{submittingPayment ? 'Menyimpan...' : 'Pilih COD Tunai'}
						</Button>
					</div>
				{:else}
					<div class="space-y-2.5">
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Input
								name="payer_name"
								type="text"
								bind:value={payerName}
								placeholder="Nama pengirim rekening"
								class="h-9 text-xs"
							/>
							<Input
								name="external_reference"
								type="text"
								bind:value={paymentExternalRef}
								placeholder="No. referensi transfer (opsional)"
								class="h-9 text-xs"
							/>
						</div>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
							<input
								type="file"
								name="proof_file"
								accept="image/jpeg,image/png,image/webp,application/pdf"
								class="block flex-1 text-xs text-muted-foreground file:mr-2.5 file:rounded-md file:border file:border-border file:bg-muted file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
							/>
							<Button
								type="submit"
								size="sm"
								disabled={submittingPayment}
								class="h-9 shrink-0 text-xs font-bold"
							>
								{submittingPayment ? 'Mengirim...' : 'Kirim Bukti'}
							</Button>
						</div>
					</div>
				{/if}
			</form>
		{/if}

		<!-- Privileged Verification (Admin / Kurir only) -->
		{#if data.isAdmin || data.isProvider}
			<div class="space-y-2.5 border-t border-border/50 pt-3.5">
				<span class="block text-xs font-bold text-primary">Kontrol Verifikasi (Admin / Kurir)</span>

				{#if !p || (p.status !== 'verified' && p.status !== 'refunded')}
					<form
						method="POST"
						action="?/verifyPayment"
						use:enhance={() => {
							processingPrivilegePayment = true;
							return async ({ update }) => {
								processingPrivilegePayment = false;
								await update();
							};
						}}
						class="flex flex-wrap items-center gap-2"
					>
						<Input
							name="paid_amount"
							type="number"
							min="0"
							step="500"
							bind:value={verifyAmount}
							required
							class="h-9 w-36 text-xs tabular-nums"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={processingPrivilegePayment}
							class="h-9 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
						>
							Verifikasi Lunas
						</Button>
					</form>
				{/if}

				{#if p && p.status === 'awaiting_verification'}
					<details class="text-xs">
						<summary class="cursor-pointer font-semibold text-destructive">
							Tolak bukti pembayaran
						</summary>
						<form
							method="POST"
							action="?/rejectPayment"
							use:enhance={() => {
								processingPrivilegePayment = true;
								return async ({ update }) => {
									processingPrivilegePayment = false;
									rejectReason = '';
									await update();
								};
							}}
							class="mt-2 flex gap-2"
						>
							<Input
								name="rejection_reason"
								type="text"
								bind:value={rejectReason}
								placeholder="Alasan penolakan..."
								required
								class="h-8 flex-1 text-xs"
							/>
							<Button type="submit" size="sm" variant="destructive" class="h-8 text-xs font-bold">
								Tolak
							</Button>
						</form>
					</details>
				{/if}

				{#if p && p.status === 'verified'}
					<details class="text-xs">
						<summary class="cursor-pointer font-semibold text-muted-foreground">
							Catat pengembalian dana (refund)
						</summary>
						<form
							method="POST"
							action="?/refundPayment"
							use:enhance={() => {
								processingPrivilegePayment = true;
								return async ({ update }) => {
									processingPrivilegePayment = false;
									refundNote = '';
									await update();
								};
							}}
							class="mt-2 flex gap-2"
						>
							<Input
								name="note"
								type="text"
								bind:value={refundNote}
								placeholder="Alasan refund..."
								required
								class="h-8 flex-1 text-xs"
							/>
							<Button type="submit" size="sm" variant="outline" class="h-8 text-xs">
								Simpan Refund
							</Button>
						</form>
					</details>
				{/if}
			</div>
		{/if}

		{#if p && p.events.length > 0}
			<details class="border-t border-border/50 pt-3 text-xs">
				<summary class="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
					Riwayat pembayaran ({p.events.length})
				</summary>
				<div class="mt-2 divide-y divide-border/40">
					{#each p.events as ev (ev.id)}
						<div class="flex items-baseline justify-between gap-2 py-1.5 text-[11px]">
							<span class="text-foreground">{ev.note || ev.to_status}</span>
							<span class="shrink-0 text-muted-foreground tabular-nums">
								{new Date(ev.created_at).toLocaleTimeString('id-ID', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					{/each}
				</div>
			</details>
		{/if}
	</section>

	<!-- 4. Struk Kasir & Bukti -->
	<section class="space-y-3.5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold text-foreground">Struk Kasir &amp; Bukti</h2>
			<span class="text-xs text-muted-foreground tabular-nums">
				{data.attachments.length} file
			</span>
		</div>

		{#if form?.evidenceError}
			<div
				role="alert"
				class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{form.evidenceError}</span>
			</div>
		{/if}

		{#if form?.evidenceSuccess}
			<div
				role="status"
				class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			>
				<CheckCircle2 class="size-4 shrink-0" />
				<span>{form.evidenceSuccess}</span>
			</div>
		{/if}

		{#if data.attachments.length > 0}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each data.attachments as att (att.id)}
					<div class="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs">
						<div class="flex items-center justify-between text-[11px]">
							<span class="font-semibold text-primary">
								{att.attachment_type === 'receipt'
									? 'Struk Kasir'
									: att.attachment_type === 'delivery_proof'
										? 'Bukti Antar'
										: 'Lampiran'}
							</span>
							<span class="text-muted-foreground tabular-nums">
								{Math.round(att.file_size / 1024)} KB
							</span>
						</div>
						{#if att.signedUrl && att.mime_type.startsWith('image/')}
							<img
								src={att.signedUrl}
								alt={att.file_name}
								class="h-36 w-full rounded-lg object-cover"
							/>
						{:else}
							<div class="flex items-center gap-2 rounded-lg bg-card p-2.5">
								<FileText class="size-4 shrink-0 text-primary" />
								<span class="truncate font-medium text-foreground">{att.file_name}</span>
							</div>
						{/if}
						{#if att.note}
							<p class="text-[11px] text-muted-foreground">{att.note}</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-xs text-muted-foreground">
				Foto struk kasir toko asli akan tampil di sini setelah kurir selesai belanja.
			</p>
		{/if}

		{#if data.isAdmin || data.isProvider}
			<form
				method="POST"
				action="?/uploadEvidence"
				enctype="multipart/form-data"
				use:enhance={() => {
					uploadingEvidence = true;
					return async ({ update }) => {
						uploadingEvidence = false;
						evidenceNote = '';
						await update();
					};
				}}
				class="space-y-2.5 border-t border-border/50 pt-3"
			>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-12">
					<select
						name="attachment_type"
						bind:value={attachmentType}
						class="h-9 rounded-md border border-input bg-background px-2.5 text-xs sm:col-span-4"
					>
						<option value="receipt">Struk Kasir Toko</option>
						<option value="delivery_proof">Bukti Pengantaran</option>
						<option value="chat_image">Gambar Tambahan</option>
					</select>
					<input
						type="file"
						name="file"
						accept="image/jpeg,image/png,image/webp,application/pdf"
						required
						class="block text-xs text-muted-foreground file:mr-2.5 file:rounded-md file:border file:border-border file:bg-muted file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-foreground sm:col-span-8"
					/>
				</div>
				<div class="flex gap-2">
					<Input
						name="note"
						type="text"
						bind:value={evidenceNote}
						placeholder="Catatan singkat (opsional)"
						class="h-9 flex-1 text-xs"
					/>
					<Button
						type="submit"
						size="sm"
						disabled={uploadingEvidence}
						class="h-9 gap-1.5 text-xs font-bold"
					>
						<Upload class="size-3.5" />
						<span>{uploadingEvidence ? 'Mengunggah...' : 'Unggah'}</span>
					</Button>
				</div>
			</form>
		{:else}
			<details class="text-xs">
				<summary class="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
					Unggah lampiran tambahan
				</summary>
				<form
					method="POST"
					action="?/uploadEvidence"
					enctype="multipart/form-data"
					use:enhance={() => {
						uploadingEvidence = true;
						return async ({ update }) => {
							uploadingEvidence = false;
							evidenceNote = '';
							await update();
						};
					}}
					class="mt-2.5 space-y-2"
				>
					<input type="hidden" name="attachment_type" value="chat_image" />
					<div class="flex flex-col gap-2 sm:flex-row">
						<input
							type="file"
							name="file"
							accept="image/jpeg,image/png,image/webp,application/pdf"
							required
							class="block flex-1 text-xs text-muted-foreground file:mr-2.5 file:rounded-md file:border file:border-border file:bg-muted file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={uploadingEvidence}
							class="h-9 text-xs font-bold"
						>
							{uploadingEvidence ? 'Mengunggah...' : 'Unggah'}
						</Button>
					</div>
				</form>
			</details>
		{/if}
	</section>

	<!-- 5. Chat & WhatsApp -->
	<section class="space-y-3.5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-sm font-bold text-foreground">Chat Pesanan</h2>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a
				href={waUrl}
				target="_blank"
				rel="external noopener noreferrer"
				class="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-[11px] font-bold text-emerald-700 transition-colors duration-150 hover:bg-emerald-600/20 dark:text-emerald-300"
			>
				<MessageSquare class="size-3.5" />
				<span>WhatsApp Kurir</span>
			</a>
		</div>

		{#if form?.chatError}
			<div
				role="alert"
				class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{form.chatError}</span>
			</div>
		{/if}

		{#if data.messages.length > 0}
			<div class="max-h-72 space-y-2.5 overflow-y-auto rounded-xl bg-muted/25 p-3.5">
				{#each data.messages as msg (msg.id)}
					{#if msg.is_system}
						<p class="text-center text-[11px] text-muted-foreground">{msg.message}</p>
					{:else}
						{@const isMine = msg.sender_id === data.user.id}
						<div class="flex flex-col {isMine ? 'items-end' : 'items-start'}">
							<div
								class="max-w-[82%] rounded-2xl px-3.5 py-2 text-xs {isMine
									? 'bg-primary text-primary-foreground'
									: 'border border-border/70 bg-card text-foreground'}"
							>
								<p class="leading-relaxed">{msg.message}</p>
							</div>
							<span class="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
								{msg.sender_role === 'customer' ? 'Pemesan' : 'Titipin'} &middot;
								{new Date(msg.created_at).toLocaleTimeString('id-ID', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<form
			method="POST"
			action="?/sendMessage"
			use:enhance={() => {
				sendingChat = true;
				return async ({ update }) => {
					sendingChat = false;
					chatInput = '';
					await update();
				};
			}}
			class="flex gap-2"
		>
			<Input
				name="message"
				type="text"
				bind:value={chatInput}
				placeholder="Tulis pesan untuk kurir..."
				required
				class="h-10 flex-1 text-xs"
			/>
			<Button type="submit" disabled={sendingChat} class="h-10 gap-1.5 px-4 text-xs font-bold">
				<Send class="size-3.5" />
				<span>{sendingChat ? 'Mengirim...' : 'Kirim'}</span>
			</Button>
		</form>

		{#if o.history && o.history.length > 0}
			<details class="border-t border-border/50 pt-3 text-xs">
				<summary class="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
					Riwayat status ({o.history.length})
				</summary>
				<div class="mt-2 divide-y divide-border/40">
					{#each o.history as h (h.id)}
						<div class="flex items-baseline justify-between gap-2 py-1.5 text-[11px]">
							<div>
								<span class="font-semibold text-foreground">
									{ORDER_STATUS_LABELS[h.to_status as keyof typeof ORDER_STATUS_LABELS]?.label ||
										h.to_status}
								</span>
								{#if h.note}
									<span class="text-muted-foreground"> &mdash; {h.note}</span>
								{/if}
							</div>
							<span class="shrink-0 text-muted-foreground tabular-nums">
								{new Date(h.created_at).toLocaleTimeString('id-ID', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					{/each}
				</div>
			</details>
		{/if}
	</section>

	<!-- 6. Cancel Order (Only when pending & customer) -->
	{#if o.status === 'pending' && data.isCustomer}
		<div class="pt-1 text-center">
			{#if !showCancelInline}
				<button
					type="button"
					onclick={() => (showCancelInline = true)}
					class="text-xs font-semibold text-destructive/80 transition-colors hover:text-destructive hover:underline"
				>
					Batalkan pesanan ini
				</button>
			{:else}
				<form
					method="POST"
					action="?/cancelOrder"
					use:enhance={() => {
						isCancelling = true;
						return async ({ update }) => {
							isCancelling = false;
							showCancelInline = false;
							await update();
						};
					}}
					class="space-y-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left"
				>
					<label for="cancellation_reason" class="block text-xs font-semibold text-destructive">
						Alasan Pembatalan
					</label>
					<Input
						id="cancellation_reason"
						name="cancellation_reason"
						type="text"
						bind:value={cancelReason}
						required
						class="h-9 bg-background text-xs"
					/>
					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => (showCancelInline = false)}
							class="h-8 text-xs"
						>
							Kembali
						</Button>
						<Button
							type="submit"
							variant="destructive"
							size="sm"
							disabled={isCancelling}
							class="h-8 text-xs font-bold"
						>
							{isCancelling ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	{/if}
</div>
