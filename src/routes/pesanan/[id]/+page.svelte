<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import type { PricingSnapshot } from '#lib/server/pricing.js';
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
		Ban
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
