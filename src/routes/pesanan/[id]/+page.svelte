<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import type { PricingSnapshot } from '#lib/server/pricing.js';
	import type { PaymentMethod } from '#lib/types/database.types.js';
	import {
		ShoppingBag,
		MapPin,
		CheckCircle2,
		Clock,
		Receipt,
		Store,
		Truck,
		AlertCircle,
		MessageSquare,
		ArrowLeft,
		XCircle,
		Ban,
		Send,
		Upload,
		FileText,
		Wallet,
		ShieldCheck,
		History
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

	const lifecycleSteps = [
		{ key: 'pending', label: 'Menunggu', icon: Clock },
		{ key: 'accepted', label: 'Diterima', icon: CheckCircle2 },
		{ key: 'shopping', label: 'Dibelikan', icon: Store },
		{ key: 'purchased', label: 'Ada Struk', icon: Receipt },
		{ key: 'delivering', label: 'Diantar', icon: Truck },
		{ key: 'completed', label: 'Selesai', icon: CheckCircle2 }
	];

	const orderFlow = ['pending', 'accepted', 'shopping', 'purchased', 'delivering', 'completed'];
	const currentStepIndex = $derived(orderFlow.indexOf(o.status));
	const progressPercent = $derived(
		currentStepIndex <= 0 ? 0 : Math.round((currentStepIndex / (orderFlow.length - 1)) * 100)
	);

	function getStepStatus(stepKey: string, currentStatus: string) {
		const currentIndex = orderFlow.indexOf(currentStatus);
		const stepIndex = orderFlow.indexOf(stepKey);

		if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
			return 'cancelled';
		}
		if (stepIndex < currentIndex) return 'completed';
		if (stepIndex === currentIndex) return 'current';
		return 'upcoming';
	}

	const waUrl = $derived.by(() => {
		const msg = encodeURIComponent(
			`Halo Titipin, saya ingin menanyakan status pesanan saya dengan nomor ${o.order_number} (${o.origin_name}).`
		);
		return `https://wa.me/628161666202?text=${msg}`;
	});

	// Workspace tab state
	let activeTab = $state<'payment' | 'evidence' | 'chat'>('payment');

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

	// Phase 9 Payment MVP state
	const p = $derived(data.payment);
	const paymentStatusMeta = $derived(
		p ? PAYMENT_STATUS_LABELS[p.status] : PAYMENT_STATUS_LABELS.unpaid
	);
	const expectedTotalAmount = $derived(Number(o.actual_total || o.total_estimated || 0));

	let selectedMethod = $state<PaymentMethod>('cash_on_delivery');
	let payerName = $state('');
	let paymentExternalRef = $state('');
	let paymentNotes = $state('');
	let submittingPayment = $state(false);

	let verifyAmount = $state('');
	let verifyExtRef = $state('');
	let verifyNote = $state('');
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

	$effect(() => {
		if (form?.evidenceError || form?.evidenceSuccess) {
			activeTab = 'evidence';
		} else if (form?.chatError || form?.chatSuccess) {
			activeTab = 'chat';
		} else if (form?.paymentError || form?.paymentSuccess) {
			activeTab = 'payment';
		}
	});
</script>

<svelte:head>
	<title>Pesanan {o.order_number} - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
	<!-- Top Utility Bar -->
	<div class="flex flex-wrap items-center justify-between gap-2">
		<a
			href={resolve('/pesanan')}
			class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<ArrowLeft class="size-4" />
			<span>Daftar Pesanan</span>
		</a>

		<span class="text-xs text-muted-foreground tabular-nums">
			Dibuat {new Date(o.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})}
		</span>
	</div>

	{#if form?.error}
		<div
			role="alert"
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.cancelSuccess}
		<div
			role="status"
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.cancelSuccess}</span>
		</div>
	{/if}

	<!-- Order Identity & Connected Progress Header -->
	<section class="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
		<div
			class="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex flex-wrap items-baseline gap-3">
				<h1
					class="font-mono text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl"
				>
					Pesanan {o.order_number}
				</h1>
				<span class="text-xs text-muted-foreground">
					{o.origin_name}
				</span>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="rounded-full border px-3 py-1 text-xs font-semibold {statusMeta.badgeClass}">
					{statusMeta.label}
				</span>
				<span
					class="rounded-full border px-3 py-1 text-xs font-semibold {paymentStatusMeta.badgeClass}"
				>
					{paymentStatusMeta.label}
				</span>
			</div>
		</div>

		{#if o.status !== 'cancelled' && o.status !== 'rejected'}
			<div class="pt-5">
				<!-- Desktop Connected Stepper -->
				<div class="relative hidden sm:block">
					<div class="absolute top-4 right-8 left-8 h-0.5 bg-border">
						<div
							class="h-full bg-primary transition-all duration-200"
							style="width: {progressPercent}%"
						></div>
					</div>
					<ol class="relative grid grid-cols-6 gap-2">
						{#each lifecycleSteps as step (step.key)}
							{@const stepState = getStepStatus(step.key, o.status)}
							{@const Icon = step.icon}
							<li class="flex flex-col items-center text-center">
								<div
									class="flex size-8 items-center justify-center rounded-full border transition-colors duration-150 {stepState ===
									'completed'
										? 'border-primary bg-primary text-primary-foreground'
										: stepState === 'current'
											? 'border-primary bg-card text-primary ring-4 ring-primary/15'
											: 'border-border bg-card text-muted-foreground'}"
								>
									<Icon class="size-4" />
								</div>
								<span
									class="mt-2 text-[11px] font-semibold {stepState === 'upcoming'
										? 'text-muted-foreground'
										: 'text-foreground'}"
								>
									{step.label}
								</span>
							</li>
						{/each}
					</ol>
				</div>

				<!-- Mobile Compact Progress Bar -->
				<div class="space-y-2 sm:hidden">
					<div class="flex items-center justify-between text-xs">
						<span class="font-semibold text-foreground">{statusMeta.label}</span>
						<span class="text-muted-foreground tabular-nums">
							Tahap {Math.max(1, currentStepIndex + 1)} / {orderFlow.length}
						</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all duration-200"
							style="width: {Math.max(12, progressPercent)}%"
						></div>
					</div>
				</div>
			</div>
		{:else}
			<div
				class="mt-4 flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:text-rose-300"
			>
				<div class="space-y-0.5">
					<div class="flex items-center gap-1.5 font-bold">
						<XCircle class="size-4 shrink-0" />
						<span>Pesanan {o.status === 'cancelled' ? 'Dibatalkan' : 'Ditolak'}</span>
					</div>
					{#if o.cancellation_reason}
						<p class="text-[11px]">Alasan: {o.cancellation_reason}</p>
					{/if}
				</div>
				<Button
					href={resolve('/pesan')}
					size="sm"
					variant="outline"
					class="h-8 text-xs font-semibold"
				>
					Buat Pesanan Baru
				</Button>
			</div>
		{/if}
	</section>

	<!-- Main Operate Workspace -->
	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
		<!-- Left Column: Order Content & Tabbed Operations (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Unified Route & Items Sheet (No Nested Cards) -->
			<section class="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
				<!-- Origin & Destination Strip -->
				<div
					class="grid grid-cols-1 divide-y divide-border/60 border-b border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
				>
					<div class="space-y-1 p-5">
						<div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
							<Store class="size-4 text-primary" />
							<span>Titik Belanja</span>
						</div>
						<p class="pt-1 text-sm font-bold text-foreground">{o.origin_name}</p>
						{#if o.origin_address}
							<p class="text-xs leading-relaxed text-muted-foreground">{o.origin_address}</p>
						{/if}
					</div>

					<div class="space-y-1 p-5">
						<div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
							<MapPin class="size-4 text-primary" />
							<span>Tujuan Pengantaran</span>
						</div>
						<p class="pt-1 text-sm font-bold text-foreground tabular-nums">
							{o.recipient_name} &middot; {o.recipient_phone}
						</p>
						<p class="text-xs leading-relaxed text-muted-foreground">
							{o.destination_address_text}
						</p>
						{#if o.customer_notes}
							<p class="pt-1 text-xs text-muted-foreground italic">
								Catatan: {o.customer_notes}
							</p>
						{/if}
					</div>
				</div>

				<!-- Items List -->
				<div class="p-5">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="flex items-center gap-2 text-sm font-bold text-foreground">
							<ShoppingBag class="size-4 text-primary" />
							<span>Daftar Barang Belanjaan</span>
						</h2>
						<span class="text-xs font-medium text-muted-foreground tabular-nums">
							{o.items.length} item
						</span>
					</div>

					<div class="divide-y divide-border/50">
						{#each o.items as it (it.id)}
							<div class="flex items-start justify-between gap-4 py-3 text-xs">
								<div class="space-y-0.5">
									<p class="font-semibold text-foreground">
										{it.name}
										<span class="font-normal text-muted-foreground tabular-nums">
											&times; {it.quantity}
											{it.unit}
										</span>
									</p>
									{#if it.notes}
										<p class="text-[11px] text-muted-foreground">{it.notes}</p>
									{/if}
								</div>

								{#if it.estimated_price}
									<span class="shrink-0 font-semibold text-foreground tabular-nums">
										Rp {Number(it.estimated_price * it.quantity).toLocaleString('id-ID')}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Focused Workspace Tabs: Pembayaran | Struk & Bukti | Chat & Riwayat -->
			<section class="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
				<div
					role="tablist"
					aria-label="Detail operasional pesanan"
					class="flex overflow-x-auto border-b border-border/60 bg-muted/30 px-2 pt-2 text-xs"
				>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'payment'}
						onclick={() => (activeTab = 'payment')}
						class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring {activeTab ===
						'payment'
							? 'border-primary bg-card text-primary'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<Wallet class="size-3.5" />
						<span>Pembayaran</span>
						<span
							class="rounded-full border px-2 py-0.5 text-[10px] font-bold {paymentStatusMeta.badgeClass}"
						>
							{paymentStatusMeta.label}
						</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'evidence'}
						onclick={() => (activeTab = 'evidence')}
						class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring {activeTab ===
						'evidence'
							? 'border-primary bg-card text-primary'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<Receipt class="size-3.5" />
						<span>Struk & Bukti</span>
						<span
							class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground tabular-nums"
						>
							{data.attachments.length}
						</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'chat'}
						onclick={() => (activeTab = 'chat')}
						class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring {activeTab ===
						'chat'
							? 'border-primary bg-card text-primary'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<MessageSquare class="size-3.5" />
						<span>Chat & Riwayat</span>
						<span
							class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground tabular-nums"
						>
							{data.messages.length}
						</span>
					</button>
				</div>

				<!-- TAB 1: PEMBAYARAN MANUAL MVP -->
				{#if activeTab === 'payment'}
					<div class="space-y-5 p-5 sm:p-6">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div>
								<h2 class="text-sm font-bold text-foreground">Pembayaran Manual (Pilot Titipin)</h2>
								<p class="text-xs text-muted-foreground">
									Status pembayaran dicatat terpisah dari status pengantaran barang.
								</p>
							</div>
							<span
								class="rounded-full border px-2.5 py-0.5 text-[11px] font-bold {paymentStatusMeta.badgeClass}"
							>
								{paymentStatusMeta.label}
							</span>
						</div>

						{#if form?.paymentError}
							<div
								role="alert"
								class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
							>
								<AlertCircle class="size-4 shrink-0" />
								<span>{form.paymentError}</span>
							</div>
						{/if}

						{#if form?.paymentSuccess}
							<div
								role="status"
								class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
							>
								<CheckCircle2 class="size-4 shrink-0" />
								<span>{form.paymentSuccess}</span>
							</div>
						{/if}

						<!-- Payment Summary Strip -->
						<div
							class="grid grid-cols-1 divide-y divide-border/60 rounded-xl border border-border/70 bg-muted/25 text-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0"
						>
							<div class="p-3.5">
								<span class="block text-[11px] text-muted-foreground">Referensi</span>
								<span class="mt-0.5 block font-mono font-bold text-foreground tabular-nums">
									{p?.payment_reference || 'Belum dibuat'}
								</span>
							</div>
							<div class="p-3.5">
								<span class="block text-[11px] text-muted-foreground">Metode Terpilih</span>
								<span class="mt-0.5 block font-bold text-foreground">
									{p ? PAYMENT_METHOD_LABELS[p.method].shortLabel : 'Belum dipilih'}
								</span>
							</div>
							<div class="p-3.5">
								<span class="block text-[11px] text-muted-foreground">
									{p?.paid_amount ? 'Nominal Terverifikasi' : 'Tagihan'}
								</span>
								<span class="mt-0.5 block font-bold text-primary tabular-nums">
									Rp {Number(p?.paid_amount ?? expectedTotalAmount).toLocaleString('id-ID')}
								</span>
							</div>
						</div>

						{#if p?.status === 'awaiting_verification'}
							<div
								class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200"
							>
								<strong>Menunggu Pemeriksaan Resmi:</strong> Bukti atau referensi transfer yang dikirim
								belum berstatus lunas hingga diverifikasi manual oleh Admin atau Kurir Titipin.
							</div>
						{:else if p?.status === 'rejected' && p.rejection_reason}
							<div
								class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-900 dark:text-rose-200"
							>
								<strong>Bukti Pembayaran Ditolak:</strong>
								{p.rejection_reason}
							</div>
						{:else if p?.status === 'verified' && p.verified_at}
							<div
								class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200"
							>
								<strong>Pembayaran Terverifikasi Lunas</strong> pada
								<span class="tabular-nums">{new Date(p.verified_at).toLocaleString('id-ID')}</span>.
								{#if p.external_reference}
									Referensi eksternal:
									<span class="font-mono font-semibold">{p.external_reference}</span>.
								{/if}
							</div>
						{/if}

						{#if p?.proofSignedUrl && p.proof_mime_type?.startsWith('image/')}
							<div class="space-y-1.5">
								<span class="text-xs font-semibold text-muted-foreground">
									Bukti Pembayaran ({p.proof_file_name})
								</span>
								<img
									src={p.proofSignedUrl}
									alt={p.proof_file_name || 'Bukti pembayaran'}
									class="max-h-56 w-full rounded-xl border border-border/70 bg-muted/20 object-contain"
								/>
							</div>
						{:else if p?.proof_file_name}
							<div
								class="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs"
							>
								<FileText class="size-4 text-primary" />
								<span class="font-semibold text-foreground">{p.proof_file_name}</span>
								{#if p.external_reference}
									<span class="ml-auto font-mono text-[11px] text-muted-foreground">
										Ref: {p.external_reference}
									</span>
								{/if}
							</div>
						{/if}

						<!-- Customer Payment Submission Form -->
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
								class="space-y-3.5 border-t border-border/60 pt-4"
							>
								<p class="text-xs font-bold text-foreground">
									Pilih Metode & Kirim Konfirmasi Pembayaran
								</p>

								<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
									{#each Object.entries(PAYMENT_METHOD_LABELS) as [mKey, mMeta] (mKey)}
										<label
											class="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors duration-150 {selectedMethod ===
											mKey
												? 'border-primary bg-primary/5 font-semibold text-foreground'
												: 'border-border/70 text-muted-foreground hover:bg-muted/30 hover:text-foreground'}"
										>
											<input
												type="radio"
												name="method"
												value={mKey}
												bind:group={selectedMethod}
												class="accent-primary"
											/>
											<span>{mMeta.shortLabel}</span>
										</label>
									{/each}
								</div>

								<p class="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
									{PAYMENT_METHOD_LABELS[selectedMethod].instructions}
								</p>

								{#if selectedMethod !== 'cash_on_delivery'}
									<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div>
											<label for="payer_name" class="mb-1 block text-xs font-semibold">
												Nama Pengirim Rekening / E-Wallet
											</label>
											<Input
												id="payer_name"
												name="payer_name"
												type="text"
												bind:value={payerName}
												placeholder="Contoh: Budi Santoso"
												class="h-9 text-xs"
											/>
										</div>
										<div>
											<label for="external_reference" class="mb-1 block text-xs font-semibold">
												Nomor Referensi / ID Transaksi
											</label>
											<Input
												id="external_reference"
												name="external_reference"
												type="text"
												bind:value={paymentExternalRef}
												placeholder="Contoh: TRF-20261127-001"
												class="h-9 text-xs"
											/>
										</div>
									</div>

									<div>
										<label for="proof_file" class="mb-1 block text-xs font-semibold">
											Unggah Bukti Transfer (JPG, PNG, WebP, PDF maks. 5 MB)
										</label>
										<input
											id="proof_file"
											type="file"
											name="proof_file"
											accept="image/jpeg,image/png,image/webp,application/pdf"
											class="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/80"
										/>
									</div>
								{/if}

								<div class="flex flex-col gap-2 sm:flex-row">
									<Input
										name="notes"
										type="text"
										bind:value={paymentNotes}
										placeholder="Catatan pembayaran (opsional)"
										class="h-9 flex-1 text-xs"
									/>
									<Button
										type="submit"
										size="sm"
										disabled={submittingPayment}
										class="h-9 gap-1.5 text-xs font-bold"
									>
										<Wallet class="size-3.5" />
										<span>
											{submittingPayment
												? 'Menyimpan...'
												: selectedMethod === 'cash_on_delivery'
													? 'Konfirmasi Pilih COD'
													: 'Kirim Bukti Pembayaran'}
										</span>
									</Button>
								</div>
							</form>
						{/if}

						<!-- Privileged Verification Controls -->
						{#if data.isAdmin || data.isProvider}
							<div class="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
								<div class="flex items-center gap-1.5 text-xs font-bold text-primary">
									<ShieldCheck class="size-4" />
									<span>Verifikasi Pembayaran (Admin / Kurir)</span>
								</div>

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
										class="grid grid-cols-1 gap-2 sm:grid-cols-12"
									>
										<div class="sm:col-span-4">
											<Input
												name="paid_amount"
												type="number"
												min="0"
												step="500"
												bind:value={verifyAmount}
												placeholder="Nominal diterima (Rp)"
												required
												class="h-9 bg-background text-xs tabular-nums"
											/>
										</div>
										<div class="sm:col-span-4">
											<Input
												name="external_reference"
												type="text"
												bind:value={verifyExtRef}
												placeholder="Ref mutasi / tunai"
												class="h-9 bg-background text-xs"
											/>
										</div>
										<div class="sm:col-span-4">
											<Button
												type="submit"
												size="sm"
												disabled={processingPrivilegePayment}
												class="h-9 w-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
											>
												Verifikasi Lunas
											</Button>
										</div>
										<div class="sm:col-span-12">
											<Input
												name="note"
												type="text"
												bind:value={verifyNote}
												placeholder="Catatan audit verifikasi (opsional)"
												class="h-9 bg-background text-xs"
											/>
										</div>
									</form>
								{/if}

								{#if p && p.status === 'awaiting_verification'}
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
										class="flex flex-col gap-2 border-t border-primary/15 pt-3 sm:flex-row"
									>
										<Input
											name="rejection_reason"
											type="text"
											bind:value={rejectReason}
											placeholder="Alasan tolak bukti (misal: nominal tidak sesuai)"
											required
											class="h-9 flex-1 bg-background text-xs"
										/>
										<Button
											type="submit"
											size="sm"
											variant="destructive"
											disabled={processingPrivilegePayment}
											class="h-9 text-xs font-bold"
										>
											Tolak Bukti
										</Button>
									</form>
								{/if}

								{#if p && p.status === 'verified'}
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
										class="flex flex-col gap-2 pt-1 sm:flex-row"
									>
										<Input
											name="note"
											type="text"
											bind:value={refundNote}
											placeholder="Catatan pengembalian dana (refund)..."
											required
											class="h-9 flex-1 bg-background text-xs"
										/>
										<Button
											type="submit"
											size="sm"
											variant="outline"
											disabled={processingPrivilegePayment}
											class="h-9 border-rose-500/40 text-xs font-bold text-rose-600 hover:bg-rose-500/10"
										>
											Catat Refund
										</Button>
									</form>
								{/if}
							</div>
						{/if}

						<!-- Audit Trail -->
						{#if p && p.events.length > 0}
							<div class="space-y-2 border-t border-border/60 pt-4">
								<h3 class="text-xs font-bold text-foreground">Jejak Audit Pembayaran</h3>
								<div class="divide-y divide-border/50">
									{#each p.events as ev (ev.id)}
										<div class="flex items-start justify-between gap-3 py-2 text-xs">
											<div class="space-y-0.5">
												<span class="font-semibold text-foreground">
													{ev.event_type} ({ev.to_status})
												</span>
												{#if ev.note}
													<p class="text-[11px] text-muted-foreground">{ev.note}</p>
												{/if}
											</div>
											<span class="shrink-0 text-[11px] text-muted-foreground tabular-nums">
												{new Date(ev.created_at).toLocaleTimeString('id-ID', {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- TAB 2: STRUK & BUKTI -->
				{#if activeTab === 'evidence'}
					<div class="space-y-5 p-5 sm:p-6">
						<div>
							<h2 class="text-sm font-bold text-foreground">Bukti Struk Kasir & Pengantaran</h2>
							<p class="text-xs text-muted-foreground">
								Lampiran privat hanya dapat diakses oleh pemesan dan pengelola Titipin.
							</p>
						</div>

						{#if form?.evidenceError}
							<div
								role="alert"
								class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
							>
								<AlertCircle class="size-4 shrink-0" />
								<span>{form.evidenceError}</span>
							</div>
						{/if}

						{#if form?.evidenceSuccess}
							<div
								role="status"
								class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
							>
								<CheckCircle2 class="size-4 shrink-0" />
								<span>{form.evidenceSuccess}</span>
							</div>
						{/if}

						{#if data.attachments.length === 0}
							<div
								class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground"
							>
								Belum ada foto struk kasir atau bukti pengantaran. Unggah foto nota di bawah setelah
								belanja selesai.
							</div>
						{:else}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{#each data.attachments as att (att.id)}
									<div class="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
										<div class="flex items-center justify-between">
											<span
												class="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
											>
												{att.attachment_type === 'receipt'
													? 'Struk Kasir Asli'
													: att.attachment_type === 'delivery_proof'
														? 'Bukti Pengantaran'
														: 'Lampiran'}
											</span>
											<span class="text-[11px] text-muted-foreground tabular-nums">
												{Math.round(att.file_size / 1024)} KB
											</span>
										</div>

										{#if att.signedUrl && att.mime_type.startsWith('image/')}
											<img
												src={att.signedUrl}
												alt={att.file_name}
												class="h-44 w-full rounded-lg border border-border/60 object-cover"
											/>
										{:else}
											<div
												class="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3"
											>
												<FileText class="size-5 shrink-0 text-primary" />
												<span class="truncate font-semibold text-foreground">{att.file_name}</span>
											</div>
										{/if}

										{#if att.note}
											<p class="text-[11px] text-muted-foreground">{att.note}</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<!-- Upload Form -->
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
							class="space-y-3 border-t border-border/60 pt-4"
						>
							<p class="text-xs font-bold text-foreground">
								Unggah Bukti / Foto (JPG, PNG, WebP, PDF maks. 5 MB)
							</p>
							<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
								<div class="sm:col-span-4">
									<select
										name="attachment_type"
										bind:value={attachmentType}
										class="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground"
									>
										<option value="receipt">Struk Kasir Toko</option>
										<option value="delivery_proof">Bukti Pengantaran</option>
										<option value="chat_image">Gambar Tambahan</option>
									</select>
								</div>
								<div class="sm:col-span-8">
									<input
										type="file"
										name="file"
										accept="image/jpeg,image/png,image/webp,application/pdf"
										required
										class="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/80"
									/>
								</div>
							</div>

							<div class="flex flex-col gap-2 sm:flex-row">
								<Input
									name="note"
									type="text"
									bind:value={evidenceNote}
									placeholder="Catatan singkat (misal: Total nota kasir Rp 32.000)"
									class="h-9 flex-1 text-xs"
								/>
								<Button
									type="submit"
									size="sm"
									disabled={uploadingEvidence}
									class="h-9 gap-1.5 text-xs font-bold"
								>
									<Upload class="size-3.5" />
									<span>{uploadingEvidence ? 'Mengunggah...' : 'Unggah Bukti'}</span>
								</Button>
							</div>
						</form>
					</div>
				{/if}

				<!-- TAB 3: CHAT & RIWAYAT STATUS -->
				{#if activeTab === 'chat'}
					<div class="space-y-5 p-5 sm:p-6">
						<div>
							<h2 class="text-sm font-bold text-foreground">Chat & Timeline Pesanan</h2>
							<p class="text-xs text-muted-foreground">
								Komunikasi langsung terkait ketersediaan barang atau patokan pengantaran.
							</p>
						</div>

						{#if form?.chatError}
							<div
								role="alert"
								class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
							>
								<AlertCircle class="size-4 shrink-0" />
								<span>{form.chatError}</span>
							</div>
						{/if}

						<div
							class="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4"
						>
							{#if data.messages.length === 0}
								<p class="py-6 text-center text-xs text-muted-foreground">
									Belum ada percakapan. Kirim pesan jika ada catatan tambahan untuk pesanan ini.
								</p>
							{:else}
								{#each data.messages as msg (msg.id)}
									{#if msg.is_system}
										<div class="flex justify-center">
											<span
												class="rounded-full border border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground"
											>
												{msg.message}
											</span>
										</div>
									{:else}
										{@const isMine = msg.sender_id === data.user.id}
										<div class="flex flex-col {isMine ? 'items-end' : 'items-start'}">
											<div
												class="max-w-[80%] rounded-2xl px-3.5 py-2 text-xs {isMine
													? 'bg-primary text-primary-foreground'
													: 'border border-border/70 bg-card text-foreground'}"
											>
												<p class="leading-relaxed">{msg.message}</p>
											</div>
											<span class="mt-1 text-[10px] text-muted-foreground tabular-nums">
												{msg.sender_role === 'customer' ? 'Pemesan' : 'Titipin'} &bull;
												{new Date(msg.created_at).toLocaleTimeString('id-ID', {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</span>
										</div>
									{/if}
								{/each}
							{/if}
						</div>

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
								placeholder="Tulis pesan untuk pesanan ini..."
								required
								class="h-10 flex-1 text-xs"
							/>
							<Button
								type="submit"
								disabled={sendingChat}
								class="h-10 gap-1.5 px-4 text-xs font-bold"
							>
								<Send class="size-3.5" />
								<span>{sendingChat ? 'Mengirim...' : 'Kirim'}</span>
							</Button>
						</form>

						{#if o.history && o.history.length > 0}
							<div class="space-y-2.5 border-t border-border/60 pt-4">
								<h3 class="flex items-center gap-1.5 text-xs font-bold text-foreground">
									<History class="size-3.5 text-primary" />
									<span>Log Riwayat Status</span>
								</h3>
								<div class="divide-y divide-border/50">
									{#each o.history as h (h.id)}
										<div class="flex items-start justify-between gap-3 py-2 text-xs">
											<div class="space-y-0.5">
												<span class="font-semibold text-foreground">
													{ORDER_STATUS_LABELS[h.to_status as keyof typeof ORDER_STATUS_LABELS]
														?.label || h.to_status}
												</span>
												{#if h.note}
													<p class="text-[11px] text-muted-foreground">{h.note}</p>
												{/if}
											</div>
											<span class="shrink-0 text-[11px] text-muted-foreground tabular-nums">
												{new Date(h.created_at).toLocaleTimeString('id-ID', {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		</div>

		<!-- Right Column: Sticky Receipt & Quick Actions (4 cols) -->
		<aside class="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<h2 class="text-sm font-bold text-foreground">Rincian Tarif</h2>
					<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
						<Receipt class="size-3.5" />
						<span>Nota Asli Toko</span>
					</span>
				</div>

				<div class="space-y-2.5 text-xs">
					{#if pricingSnapshot?.lineItems}
						{#each pricingSnapshot.lineItems as li (li.code)}
							<div class="flex items-baseline justify-between gap-2">
								<span class="text-muted-foreground">{li.label}</span>
								<span class="font-semibold text-foreground tabular-nums">
									Rp {Number(li.amount).toLocaleString('id-ID')}
								</span>
							</div>
						{/each}
					{:else}
						<div class="flex items-baseline justify-between gap-2">
							<span class="text-muted-foreground">Tarif Jastip Flat</span>
							<span class="font-semibold text-foreground tabular-nums">
								Rp {Number(o.jastip_fee).toLocaleString('id-ID')}
							</span>
						</div>
					{/if}

					<div
						class="flex items-baseline justify-between border-t border-dashed border-border pt-3 text-sm font-bold"
					>
						<span class="text-foreground">
							{o.actual_total ? 'Total Aktual' : 'Total Estimasi'}
						</span>
						<span class="text-base text-primary tabular-nums">
							Rp {Number(o.actual_total || o.total_estimated).toLocaleString('id-ID')}
						</span>
					</div>

					<div class="flex items-center justify-between border-t border-border/50 pt-2.5">
						<span class="text-xs text-muted-foreground">Status Bayar</span>
						<span
							class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold {paymentStatusMeta.badgeClass}"
						>
							{paymentStatusMeta.label}
						</span>
					</div>
				</div>

				<p class="rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
					Foto struk kasir toko fisik asli dilampirkan di tab <strong>Struk &amp; Bukti</strong> sebagai
					bukti harga murni tanpa markup.
				</p>

				<!-- Primary Actions -->
				<div class="space-y-2.5 pt-1">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href={waUrl}
						target="_blank"
						rel="external noopener noreferrer"
						class="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600/10 text-xs font-bold text-emerald-700 transition-colors duration-150 hover:bg-emerald-600/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:text-emerald-300"
					>
						<MessageSquare class="size-4" />
						<span>Hubungi WhatsApp Kurir</span>
					</a>

					{#if o.status === 'pending' && data.isCustomer}
						{#if !showCancelInline}
							<button
								type="button"
								onclick={() => (showCancelInline = true)}
								class="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/25 text-xs font-semibold text-destructive transition-colors duration-150 hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
							>
								<Ban class="size-3.5" />
								<span>Batalkan Pesanan</span>
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
								class="space-y-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
							>
								<label
									for="cancellation_reason"
									class="block text-[11px] font-semibold text-destructive"
								>
									Alasan Pembatalan
								</label>
								<Input
									id="cancellation_reason"
									name="cancellation_reason"
									type="text"
									bind:value={cancelReason}
									required
									class="h-8 bg-background text-xs"
								/>
								<div class="flex justify-end gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => (showCancelInline = false)}
										class="h-8 text-xs"
									>
										Batal
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
					{/if}
				</div>
			</div>
		</aside>
	</div>
</div>
