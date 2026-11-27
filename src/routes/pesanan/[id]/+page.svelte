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
		ShieldCheck
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
		{ key: 'purchased', label: 'Ada Struk Toko', icon: Receipt },
		{ key: 'delivering', label: 'Diantar', icon: Truck },
		{ key: 'completed', label: 'Selesai', icon: CheckCircle2 }
	];

	function getStepStatus(stepKey: string, currentStatus: string) {
		const orderFlow = ['pending', 'accepted', 'shopping', 'purchased', 'delivering', 'completed'];
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

	let isCancelling = $state(false);
	let showCancelModal = $state(false);
	let cancelReason = $state('Salah tulis menu / berubah pikiran');

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
</script>

<svelte:head>
	<title>Pesanan {o.order_number} - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Top Navigation -->
	<div class="flex items-center justify-between border-b border-border/60 pb-4">
		<a
			href={resolve('/pesanan')}
			class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			<span>Kembali ke Daftar Pesanan</span>
		</a>

		<span class="text-xs text-muted-foreground">
			Dibuat pada {new Date(o.created_at).toLocaleDateString('id-ID', {
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
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.cancelSuccess}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.cancelSuccess}</span>
		</div>
	{/if}

	<!-- Order Header & Live Status Card -->
	<div class="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
		<div
			class="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="space-y-1">
				<span class="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
					Nomor Transaksi Titipin
				</span>
				<h1 class="font-mono text-xl font-black text-foreground sm:text-2xl">
					{o.order_number}
				</h1>
			</div>

			<div class="flex items-center gap-2">
				<span class="rounded-full border px-3 py-1 text-xs font-bold {statusMeta.badgeClass}">
					{statusMeta.label}
				</span>
			</div>
		</div>

		<!-- Lifecycle Stepper -->
		{#if o.status !== 'cancelled' && o.status !== 'rejected'}
			<div class="space-y-3">
				<span class="text-xs font-bold text-foreground">Progres Pengantaran Jastip</span>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-6">
					{#each lifecycleSteps as step (step.key)}
						{@const stepState = getStepStatus(step.key, o.status)}
						{@const Icon = step.icon}
						<div
							class="flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all {stepState ===
							'completed'
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
								: stepState === 'current'
									? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
									: 'border-border/60 bg-muted/20 text-muted-foreground/60'}"
						>
							<Icon class="mb-1 size-4" />
							<span class="text-[10px] font-bold">{step.label}</span>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div
				class="space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300"
			>
				<div class="flex items-center gap-1.5 font-bold">
					<XCircle class="size-4" />
					<span>Pesanan Dihentikan ({o.status === 'cancelled' ? 'Dibatalkan' : 'Ditolak'})</span>
				</div>
				{#if o.cancellation_reason}
					<p class="text-[11px] leading-relaxed">
						Alasan: {o.cancellation_reason}
					</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Main 12-Column Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- Left: Items & Locations (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Order Items Card -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center gap-2 border-b border-border/60 pb-3">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<ShoppingBag class="size-4" />
					</div>
					<h2 class="text-sm font-bold text-foreground">Daftar Barang Belanjaan</h2>
				</div>

				<div class="divide-y divide-border/50">
					{#each o.items as it (it.id)}
						<div class="flex items-start justify-between py-3 text-xs">
							<div class="space-y-0.5">
								<p class="font-bold text-foreground">
									{it.name}
									<span class="font-normal text-muted-foreground">({it.quantity} {it.unit})</span>
								</p>
								{#if it.notes}
									<p class="text-[11px] text-muted-foreground italic">
										Catatan: {it.notes}
									</p>
								{/if}
							</div>

							{#if it.estimated_price}
								<span class="font-semibold text-foreground">
									Rp {Number(it.estimated_price * it.quantity).toLocaleString('id-ID')}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Origin & Destination Info Card -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="space-y-2 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
					<div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
						<Store class="size-4 text-primary" />
						<span>Toko / Warung Asal</span>
					</div>
					<p class="text-xs font-bold text-foreground">{o.origin_name}</p>
					{#if o.origin_address}
						<p class="text-[11px] leading-relaxed text-muted-foreground">
							{o.origin_address}
						</p>
					{/if}
				</div>

				<div class="space-y-2 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
					<div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
						<MapPin class="size-4 text-primary" />
						<span>Alamat Pengantaran</span>
					</div>
					<p class="text-xs font-bold text-foreground">{o.recipient_name} ({o.recipient_phone})</p>
					<p class="text-[11px] leading-relaxed text-muted-foreground">
						{o.destination_address_text}
					</p>
					{#if o.customer_notes}
						<p class="border-t border-border/50 pt-2 text-[11px] text-muted-foreground italic">
							Catatan: {o.customer_notes}
						</p>
					{/if}
				</div>
			</div>

			<!-- Status History Timeline -->
			{#if o.history && o.history.length > 0}
				<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
					<h3 class="text-xs font-bold text-foreground">Log Riwayat Status</h3>
					<div class="space-y-3">
						{#each o.history as h (h.id)}
							<div class="flex items-start gap-3 text-xs">
								<div class="mt-0.5 flex size-2 shrink-0 rounded-full bg-primary"></div>
								<div class="flex-1 space-y-0.5">
									<div class="flex items-center justify-between">
										<span class="font-bold text-foreground">
											{ORDER_STATUS_LABELS[h.to_status as keyof typeof ORDER_STATUS_LABELS]
												?.label || h.to_status}
										</span>
										<span class="text-[10px] text-muted-foreground">
											{new Date(h.created_at).toLocaleTimeString('id-ID', {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>
									{#if h.note}
										<p class="text-[11px] text-muted-foreground">{h.note}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Pembayaran Manual MVP (Status Terpisah dari Status Pesanan) -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div
					class="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-2">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Wallet class="size-4" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-foreground">Pembayaran Manual (Pilot Titipin)</h2>
							<p class="text-[11px] text-muted-foreground">
								Status pembayaran dikelola terpisah dari status pengiriman pesanan
							</p>
						</div>
					</div>

					<span
						class="self-start rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:self-auto {paymentStatusMeta.badgeClass}"
					>
						{paymentStatusMeta.label}
					</span>
				</div>

				{#if form?.paymentError}
					<div
						class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
					>
						<AlertCircle class="size-4 shrink-0" />
						<span>{form.paymentError}</span>
					</div>
				{/if}

				{#if form?.paymentSuccess}
					<div
						class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
					>
						<CheckCircle2 class="size-4 shrink-0" />
						<span>{form.paymentSuccess}</span>
					</div>
				{/if}

				<!-- Ringkasan Referensi & Status -->
				<div
					class="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs sm:grid-cols-3"
				>
					<div>
						<span class="block text-[10px] font-semibold text-muted-foreground uppercase">
							Referensi Pembayaran
						</span>
						<span class="font-mono font-bold text-foreground">
							{p?.payment_reference || 'Belum dibuat'}
						</span>
					</div>
					<div>
						<span class="block text-[10px] font-semibold text-muted-foreground uppercase">
							Metode Terpilih
						</span>
						<span class="font-bold text-foreground">
							{p ? PAYMENT_METHOD_LABELS[p.method].shortLabel : 'Belum dipilih'}
						</span>
					</div>
					<div>
						<span class="block text-[10px] font-semibold text-muted-foreground uppercase">
							Tagihan / Terverifikasi
						</span>
						<span class="font-bold text-primary">
							Rp {Number(p?.paid_amount ?? expectedTotalAmount).toLocaleString('id-ID')}
						</span>
					</div>
				</div>

				{#if p?.status === 'awaiting_verification'}
					<div
						class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300"
					>
						<strong>Menunggu Pemeriksaan Resmi:</strong> Bukti atau referensi transfer yang Anda kirim
						belum dianggap lunas otomatis hingga diverifikasi secara manual oleh Admin atau Kurir Titipin.
					</div>
				{:else if p?.status === 'rejected' && p.rejection_reason}
					<div
						class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-800 dark:text-rose-300"
					>
						<strong>Bukti Pembayaran Ditolak:</strong>
						{p.rejection_reason}
					</div>
				{:else if p?.status === 'verified' && p.verified_at}
					<div
						class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300"
					>
						<strong>Pembayaran Dikonfirmasi Lunas</strong> pada
						{new Date(p.verified_at).toLocaleString('id-ID')}.
						{#if p.external_reference}
							Referensi eksternal: <span class="font-mono font-semibold">
								{p.external_reference}
							</span>.
						{/if}
					</div>
				{/if}

				{#if p?.proofSignedUrl && p.proof_mime_type?.startsWith('image/')}
					<div class="space-y-1.5">
						<span class="text-[11px] font-semibold text-muted-foreground">
							Bukti Pembayaran Terunggah ({p.proof_file_name})
						</span>
						<img
							src={p.proofSignedUrl}
							alt={p.proof_file_name || 'Bukti pembayaran'}
							class="max-h-52 w-full rounded-xl border border-border/70 bg-muted/20 object-contain"
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

				<!-- Customer Payment Submission Form (blocked once verified or refunded) -->
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
						class="space-y-3 border-t border-border/60 pt-4"
					>
						<p class="text-xs font-bold text-foreground">
							Pilih Metode & Kirim Konfirmasi Pembayaran
						</p>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
							{#each Object.entries(PAYMENT_METHOD_LABELS) as [mKey, mMeta] (mKey)}
								<label
									class="flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-xs transition-colors {selectedMethod ===
									mKey
										? 'border-primary bg-primary/5 font-semibold'
										: 'border-border/70 hover:bg-muted/30'}"
								>
									<input
										type="radio"
										name="method"
										value={mKey}
										bind:group={selectedMethod}
										class="mt-0.5 accent-primary"
									/>
									<span>{mMeta.shortLabel}</span>
								</label>
							{/each}
						</div>

						<p
							class="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground"
						>
							{PAYMENT_METHOD_LABELS[selectedMethod].instructions}
						</p>

						{#if selectedMethod !== 'cash_on_delivery'}
							<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
								<div>
									<label for="payer_name" class="mb-1 block text-[11px] font-semibold">
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
									<label for="external_reference" class="mb-1 block text-[11px] font-semibold">
										Nomor Referensi / ID Transaksi Bank
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
								<label for="proof_file" class="mb-1 block text-[11px] font-semibold">
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

				<!-- Privileged Verification Controls (Admin or Assigned Provider ONLY) -->
				{#if data.isAdmin || data.isProvider}
					<div class="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
						<div class="flex items-center gap-1.5 text-xs font-bold text-primary">
							<ShieldCheck class="size-4" />
							<span>Panel Verifikasi Pembayaran (Hak Akses Admin / Kurir)</span>
						</div>

						{#if !p || p.status !== 'verified'}
							{#if p?.status !== 'refunded'}
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
											class="h-8 bg-background text-xs"
										/>
									</div>
									<div class="sm:col-span-4">
										<Input
											name="external_reference"
											type="text"
											bind:value={verifyExtRef}
											placeholder="Ref mutasi / tunai"
											class="h-8 bg-background text-xs"
										/>
									</div>
									<div class="sm:col-span-4">
										<Button
											type="submit"
											size="sm"
											disabled={processingPrivilegePayment}
											class="h-8 w-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
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
											class="h-8 bg-background text-xs"
										/>
									</div>
								</form>
							{/if}
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
								class="flex flex-col gap-2 border-t border-primary/15 pt-2 sm:flex-row"
							>
								<Input
									name="rejection_reason"
									type="text"
									bind:value={rejectReason}
									placeholder="Alasan tolak bukti (misal: nominal tidak sesuai)"
									required
									class="h-8 flex-1 bg-background text-xs"
								/>
								<Button
									type="submit"
									size="sm"
									variant="destructive"
									disabled={processingPrivilegePayment}
									class="h-8 text-xs font-bold"
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
									class="h-8 flex-1 bg-background text-xs"
								/>
								<Button
									type="submit"
									size="sm"
									variant="outline"
									disabled={processingPrivilegePayment}
									class="h-8 border-rose-500/40 text-xs font-bold text-rose-600 hover:bg-rose-500/10"
								>
									Catat Refund
								</Button>
							</form>
						{/if}
					</div>
				{/if}

				<!-- Immutable Payment Audit Trail -->
				{#if p && p.events.length > 0}
					<div class="space-y-2 border-t border-border/60 pt-3">
						<span class="text-[11px] font-bold text-foreground">Jejak Audit Pembayaran</span>
						<div class="space-y-1.5">
							{#each p.events as ev (ev.id)}
								<div
									class="flex items-start justify-between gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-[11px]"
								>
									<div class="space-y-0.5">
										<span class="font-semibold text-foreground">
											{ev.event_type} ({ev.to_status})
										</span>
										{#if ev.note}
											<p class="text-muted-foreground">{ev.note}</p>
										{/if}
									</div>
									<span class="shrink-0 text-[10px] text-muted-foreground">
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

			<!-- Bukti Struk Kasir & Pengantaran (Evidence Attachments) -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div class="flex items-center gap-2">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Receipt class="size-4" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-foreground">Bukti Struk Kasir & Pengantaran</h2>
							<p class="text-[11px] text-muted-foreground">
								Lampiran privat hanya dapat diakses oleh pemesan dan pengelola
							</p>
						</div>
					</div>
				</div>

				{#if form?.evidenceError}
					<div
						class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
					>
						<AlertCircle class="size-4 shrink-0" />
						<span>{form.evidenceError}</span>
					</div>
				{/if}

				{#if form?.evidenceSuccess}
					<div
						class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
					>
						<CheckCircle2 class="size-4 shrink-0" />
						<span>{form.evidenceSuccess}</span>
					</div>
				{/if}

				{#if data.attachments.length === 0}
					<div
						class="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground"
					>
						Belum ada foto struk kasir atau bukti pengantaran yang diunggah.
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
									<span class="text-[10px] text-muted-foreground">
										{Math.round(att.file_size / 1024)} KB
									</span>
								</div>

								{#if att.signedUrl && att.mime_type.startsWith('image/')}
									<img
										src={att.signedUrl}
										alt={att.file_name}
										class="h-40 w-full rounded-lg border border-border/60 object-cover"
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

			<!-- Order-Scoped Chat & System Timeline -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center gap-2 border-b border-border/60 pb-3">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<MessageSquare class="size-4" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-foreground">Chat & Timeline Pesanan</h2>
						<p class="text-[11px] text-muted-foreground">
							Komunikasi langsung terkait ketersediaan barang atau patokan pengantaran
						</p>
					</div>
				</div>

				{#if form?.chatError}
					<div
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
										class="rounded-full border border-border/60 bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground"
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
									<span class="mt-1 text-[10px] text-muted-foreground">
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
					<Button type="submit" disabled={sendingChat} class="h-10 gap-1.5 px-4 text-xs font-bold">
						<Send class="size-3.5" />
						<span>{sendingChat ? 'Mengirim...' : 'Kirim'}</span>
					</Button>
				</form>
			</div>
		</div>

		<!-- Right Column: Pricing Breakdown & CTAs (4 cols) -->
		<div class="space-y-6 lg:sticky lg:top-20 lg:col-span-4">
			<!-- Pricing Snapshot Card -->
			<div class="space-y-4 rounded-2xl border border-primary/30 bg-card p-6 shadow-md">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<span class="text-xs font-bold text-foreground">Rincian Tarif Resmi</span>
					<div class="flex items-center gap-1 text-[10px] font-bold text-primary">
						<Receipt class="size-3" />
						<span>Snapshot Transparan</span>
					</div>
				</div>

				<div class="space-y-2 text-xs">
					{#if pricingSnapshot?.lineItems}
						{#each pricingSnapshot.lineItems as li (li.code)}
							<div class="flex justify-between">
								<span class="text-muted-foreground">{li.label}</span>
								<span class="font-semibold text-foreground">
									Rp {Number(li.amount).toLocaleString('id-ID')}
								</span>
							</div>
						{/each}
					{:else}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Tarif Jastip Flat</span>
							<span class="font-semibold text-foreground">
								Rp {Number(o.jastip_fee).toLocaleString('id-ID')}
							</span>
						</div>
					{/if}

					<div class="flex justify-between border-t border-border/60 pt-3 text-sm font-black">
						<span class="text-foreground">Total Estimasi</span>
						<span class="text-primary">
							Rp {Number(o.actual_total || o.total_estimated).toLocaleString('id-ID')}
						</span>
					</div>

					<div class="flex items-center justify-between border-t border-border/40 pt-2.5">
						<span class="text-[11px] font-semibold text-muted-foreground">Status Pembayaran</span>
						<span
							class="rounded-full border px-2 py-0.5 text-[10px] font-bold {paymentStatusMeta.badgeClass}"
						>
							{paymentStatusMeta.label}
						</span>
					</div>
				</div>

				<div
					class="rounded-xl border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground"
				>
					Nota kasir toko fisik asli akan difoto saat belanja selesai sebagai bukti transaksi 100%
					tanpa markup.
				</div>

				<!-- Actions -->
				<div class="space-y-2.5 pt-2">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href={waUrl}
						target="_blank"
						rel="external noopener noreferrer"
						class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
					>
						<MessageSquare class="size-4" />
						<span>Hubungi WhatsApp Kurir</span>
					</a>

					{#if o.status === 'pending' && data.isCustomer}
						<button
							type="button"
							onclick={() => (showCancelModal = true)}
							class="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/20 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
						>
							<Ban class="size-3.5" />
							<span>Batalkan Pesanan</span>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Cancel Order Confirmation Modal -->
{#if showCancelModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
			<div class="flex items-center gap-2 text-destructive">
				<AlertCircle class="size-5" />
				<h3 class="text-sm font-bold">Batalkan Pesanan Ini?</h3>
			</div>

			<p class="text-xs leading-relaxed text-muted-foreground">
				Pesanan yang dibatalkan tidak dapat diaktifkan kembali. Anda dapat membuat pesanan baru
				kapan saja.
			</p>

			<form
				method="POST"
				action="?/cancelOrder"
				use:enhance={() => {
					isCancelling = true;
					return async ({ update }) => {
						isCancelling = false;
						showCancelModal = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="cancellation_reason" class="mb-1 block text-xs font-semibold text-foreground">
						Alasan Pembatalan
					</label>
					<Input
						id="cancellation_reason"
						name="cancellation_reason"
						type="text"
						bind:value={cancelReason}
						required
						class="text-xs"
					/>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => (showCancelModal = false)}
						class="text-xs"
					>
						Kembali
					</Button>
					<Button
						type="submit"
						variant="destructive"
						size="sm"
						disabled={isCancelling}
						class="text-xs font-bold"
					>
						{isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
