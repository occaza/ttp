<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { ServiceCategory } from '#lib/types/database.types.js';
	import { ORDER_STATUS_LABELS, formatCleanAddress } from '#lib/constants/order.js';
	import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import {
		AlertCircle,
		AlertTriangle,
		ArrowRight,
		BadgeCheck,
		CheckCircle2,
		ExternalLink,
		FileText,
		Layers,
		LayoutDashboard,
		Pencil,
		Plus,
		Power,
		ShoppingBag,
		Sliders,
		ToggleLeft,
		ToggleRight,
		Trash2,
		Users,
		Wallet
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type AdminTab =
		'overview' | 'orders' | 'payments' | 'disputes' | 'categories' | 'users' | 'settings' | 'audit';

	let activeTab = $state<AdminTab>('overview');
	let orderFilter = $state<'all' | 'actionable' | 'completed'>('all');
	let paymentFilter = $state<'all' | 'pending' | 'verified'>('all');

	let isCategoryModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingCategory = $state<ServiceCategory | null>(null);

	function openAddCategoryModal() {
		editingCategory = null;
		isCategoryModalOpen = true;
	}

	function openEditCategoryModal(cat: ServiceCategory) {
		editingCategory = cat;
		isCategoryModalOpen = true;
	}

	const filteredOrders = $derived.by(() => {
		if (orderFilter === 'actionable') {
			return data.orders.filter((o) =>
				['pending', 'accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
			);
		}
		if (orderFilter === 'completed') {
			return data.orders.filter((o) => ['completed', 'cancelled', 'rejected'].includes(o.status));
		}
		return data.orders;
	});

	const filteredPayments = $derived.by(() => {
		if (paymentFilter === 'pending') {
			return data.payments.filter(
				(p) => p.status === 'awaiting_verification' || p.status === 'unpaid'
			);
		}
		if (paymentFilter === 'verified') {
			return data.payments.filter((p) => p.status === 'verified');
		}
		return data.payments;
	});

	const navGroups = $derived([
		{
			label: 'Operasional',
			items: [
				{ id: 'overview' as AdminTab, label: 'Ringkasan', icon: LayoutDashboard, badge: 0 },
				{
					id: 'orders' as AdminTab,
					label: 'Pesanan',
					icon: ShoppingBag,
					badge: data.stats.pendingOrders
				},
				{
					id: 'payments' as AdminTab,
					label: 'Pembayaran',
					icon: Wallet,
					badge: data.stats.awaitingPayments
				},
				{
					id: 'disputes' as AdminTab,
					label: 'Laporan',
					icon: AlertTriangle,
					badge: data.stats.openDisputes
				}
			]
		},
		{
			label: 'Konfigurasi',
			items: [
				{ id: 'categories' as AdminTab, label: 'Kategori', icon: Layers, badge: 0 },
				{ id: 'users' as AdminTab, label: 'Pengguna & Mitra', icon: Users, badge: 0 },
				{ id: 'settings' as AdminTab, label: 'Tarif & Platform', icon: Sliders, badge: 0 },
				{ id: 'audit' as AdminTab, label: 'Audit Log', icon: FileText, badge: 0 }
			]
		}
	]);
</script>

<svelte:head>
	<title>Pusat Kendali Admin - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
	<!-- Compact Header -->
	<header
		class="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="min-w-0">
			<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
				Pusat Kendali Titipin
			</h1>
			<p class="mt-0.5 truncate text-xs text-muted-foreground">
				{data.profile?.full_name || 'Owner'} ({data.user?.email}) &middot;
				<span
					class="font-semibold {data.settings.allow_provider_registration
						? 'text-emerald-600'
						: 'text-amber-600'}"
				>
					{data.settings.allow_provider_registration
						? 'Pendaftaran Mitra Terbuka'
						: 'Mode Internal (Mandiri)'}
				</span>
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-2">
			<Button variant="outline" size="sm" href={resolve('/profil')} class="h-9 text-xs">
				Profil
			</Button>
			<Button
				variant="outline"
				size="sm"
				href={resolve('/')}
				target="_blank"
				class="h-9 gap-1.5 text-xs"
			>
				<span>Web Publik</span>
				<ExternalLink class="size-3.5" />
			</Button>
		</div>
	</header>

	<!-- Feedback Banner -->
	{#if form?.error}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}
	{#if form?.message}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs font-semibold text-primary"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Mobile Navigation Grid (Zero horizontal scrollbar, all sections 1-tap accessible) -->
	<nav
		aria-label="Navigasi Admin Mobile"
		class="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:hidden"
	>
		{#each navGroups as group (group.label)}
			{#each group.items as item (item.id)}
				{@const Icon = item.icon}
				<button
					type="button"
					onclick={() => (activeTab = item.id)}
					class="flex min-h-10 items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors {activeTab ===
					item.id
						? 'border-primary bg-primary font-semibold text-primary-foreground'
						: 'border-border/80 bg-card text-foreground hover:bg-muted/60'}"
				>
					<span class="flex items-center gap-1.5 truncate">
						<Icon class="size-3.5 shrink-0" />
						<span class="truncate">{item.label}</span>
					</span>
					{#if item.badge > 0}
						<span
							class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums {activeTab ===
							item.id
								? 'bg-primary-foreground/20 text-primary-foreground'
								: 'bg-destructive/15 text-destructive'}"
						>
							{item.badge}
						</span>
					{/if}
				</button>
			{/each}
		{/each}
	</nav>

	<!-- Desktop Two-Column Workspace -->
	<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[224px_1fr] lg:items-start">
		<!-- Desktop Sidebar Rail -->
		<aside
			aria-label="Navigasi Admin Desktop"
			class="sticky top-6 hidden space-y-5 rounded-xl border border-border/80 bg-card p-3 lg:block"
		>
			{#each navGroups as group (group.label)}
				<div class="space-y-1">
					<p class="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
						{group.label}
					</p>
					{#each group.items as item (item.id)}
						{@const Icon = item.icon}
						<button
							type="button"
							onclick={() => (activeTab = item.id)}
							class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors {activeTab ===
							item.id
								? 'bg-primary/10 font-semibold text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
						>
							<span class="flex items-center gap-2 truncate">
								<Icon class="size-4 shrink-0" />
								<span class="truncate">{item.label}</span>
							</span>
							{#if item.badge > 0}
								<span
									class="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold text-destructive tabular-nums"
								>
									{item.badge}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/each}

			<div class="border-t border-border/70 pt-3">
				<div class="rounded-lg bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
					<div class="flex items-center justify-between">
						<span>Pengguna</span>
						<strong class="text-foreground tabular-nums">{data.stats.totalUsers}</strong>
					</div>
					<div class="mt-1 flex items-center justify-between">
						<span>Kategori Aktif</span>
						<strong class="text-foreground tabular-nums">
							{data.stats.activeCategories}/{data.stats.totalCategories}
						</strong>
					</div>
				</div>
			</div>
		</aside>

		<!-- Main Content Area -->
		<main class="min-w-0 space-y-5">
			<!-- OVERVIEW -->
			{#if activeTab === 'overview'}
				<section class="space-y-5">
					<!-- Action Queue: What needs attention right now -->
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<button
							type="button"
							onclick={() => {
								orderFilter = 'actionable';
								activeTab = 'orders';
							}}
							class="group flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
						>
							<div>
								<p class="text-xs font-medium text-muted-foreground">Pesanan Perlu Tindakan</p>
								<p class="mt-1 text-2xl font-bold text-foreground tabular-nums">
									{data.stats.pendingOrders + data.stats.activeOrders}
								</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground">
									{data.stats.pendingOrders} baru &middot; {data.stats.activeOrders} berjalan
								</p>
							</div>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
							>
								<ShoppingBag class="size-5" />
							</div>
						</button>

						<button
							type="button"
							onclick={() => {
								paymentFilter = 'pending';
								activeTab = 'payments';
							}}
							class="group flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
						>
							<div>
								<p class="text-xs font-medium text-muted-foreground">Verifikasi Pembayaran</p>
								<p class="mt-1 text-2xl font-bold text-foreground tabular-nums">
									{data.stats.awaitingPayments}
								</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground">Menunggu konfirmasi admin</p>
							</div>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"
							>
								<Wallet class="size-5" />
							</div>
						</button>

						<button
							type="button"
							onclick={() => (activeTab = 'disputes')}
							class="group flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
						>
							<div>
								<p class="text-xs font-medium text-muted-foreground">Laporan Terbuka</p>
								<p class="mt-1 text-2xl font-bold text-foreground tabular-nums">
									{data.stats.openDisputes}
								</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground">Kendala dari pelanggan/mitra</p>
							</div>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
							>
								<AlertTriangle class="size-5" />
							</div>
						</button>
					</div>

					<!-- Operational Mode Control (Compact single bar) -->
					<div
						class="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center"
					>
						<div class="space-y-0.5">
							<h2 class="text-sm font-bold text-foreground">Pendaftaran Mitra Eksternal</h2>
							<p class="text-xs text-muted-foreground">
								{#if data.settings.allow_provider_registration}
									Terbuka untuk umum: pendaftar baru dapat memilih peran Mitra di halaman daftar.
								{:else}
									Ditutup (mode mandiri): seluruh pesanan ditangani langsung oleh tim internal.
								{/if}
							</p>
						</div>

						<form
							method="POST"
							action="?/toggleMitraRegistration"
							class="shrink-0"
							use:enhance={() => {
								isSubmitting = true;
								return async ({ update }) => {
									await update();
									isSubmitting = false;
								};
							}}
						>
							<input
								type="hidden"
								name="current_status"
								value={String(data.settings.allow_provider_registration)}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting}
								variant={data.settings.allow_provider_registration ? 'outline' : 'default'}
								class="h-9 gap-1.5 text-xs font-semibold"
							>
								{#if data.settings.allow_provider_registration}
									<ToggleLeft class="size-4" />
									<span>Tutup Pendaftaran</span>
								{:else}
									<ToggleRight class="size-4" />
									<span>Buka Pendaftaran</span>
								{/if}
							</Button>
						</form>
					</div>

					<!-- Recent Orders Preview -->
					<div class="rounded-xl border border-border/80 bg-card">
						<div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
							<h2 class="text-sm font-bold text-foreground">Pesanan Terbaru</h2>
							<button
								type="button"
								onclick={() => (activeTab = 'orders')}
								class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
							>
								<span>Lihat semua ({data.orders.length})</span>
								<ArrowRight class="size-3.5" />
							</button>
						</div>

						{#if data.orders.length === 0}
							<div class="px-4 py-8 text-center text-xs text-muted-foreground">
								Belum ada pesanan masuk. Pesanan baru dari pelanggan akan muncul di sini.
							</div>
						{:else}
							<div class="divide-y divide-border/60">
								{#each data.orders.slice(0, 4) as ord (ord.id)}
									{@const oMeta = ORDER_STATUS_LABELS[ord.status] || {
										label: ord.status,
										badgeClass: 'bg-muted text-muted-foreground'
									}}
									<div
										class="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
									>
										<div class="min-w-0 space-y-0.5">
											<div class="flex flex-wrap items-center gap-2">
												<span class="font-mono text-xs font-bold text-foreground">
													{ord.order_number}
												</span>
												<span
													class="rounded-full border px-2 py-0.5 text-[10px] font-semibold {oMeta.badgeClass}"
												>
													{oMeta.label}
												</span>
											</div>
											<p class="truncate text-xs text-muted-foreground">
												{ord.origin_name} &rarr; {ord.recipient_name} ({ord.items.length} item)
											</p>
										</div>

										<div class="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
											<span class="text-xs font-bold text-foreground tabular-nums">
												Rp {Number(ord.actual_total || ord.total_estimated).toLocaleString('id-ID')}
											</span>
											<a
												href={resolve('/pesanan/[id]', { id: ord.order_number })}
												class="text-xs font-semibold text-primary hover:underline"
											>
												Buka
											</a>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- ORDERS -->
			{#if activeTab === 'orders'}
				<section class="space-y-4">
					<div
						class="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<h2 class="text-base font-bold text-foreground">Pesanan Jastip</h2>
							<p class="text-xs text-muted-foreground">
								Kelola penerimaan, input total struk kasir asli, dan penyelesaian antar.
							</p>
						</div>

						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => (orderFilter = 'all')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {orderFilter ===
								'all'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Semua ({data.orders.length})
							</button>
							<button
								type="button"
								onclick={() => (orderFilter = 'actionable')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {orderFilter ===
								'actionable'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Aktif ({data.stats.pendingOrders + data.stats.activeOrders})
							</button>
							<button
								type="button"
								onclick={() => (orderFilter = 'completed')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {orderFilter ===
								'completed'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Selesai / Batal
							</button>
						</div>
					</div>

					{#if filteredOrders.length === 0}
						<div
							class="rounded-xl border border-border/80 bg-card px-4 py-10 text-center text-xs text-muted-foreground"
						>
							Tidak ada pesanan pada filter ini.
						</div>
					{:else}
						<div class="space-y-3">
							{#each filteredOrders as ord (ord.id)}
								{@const oMeta = ORDER_STATUS_LABELS[ord.status] || {
									label: ord.status,
									badgeClass: 'bg-muted text-muted-foreground'
								}}
								{@const pMeta = PAYMENT_STATUS_LABELS[ord.paymentStatus]}
								<div class="space-y-3 rounded-xl border border-border/80 bg-card p-4 text-xs">
									<div
										class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5"
									>
										<div class="flex flex-wrap items-center gap-2">
											<span class="font-mono font-bold text-foreground">{ord.order_number}</span>
											<span
												class="rounded-full border px-2 py-0.5 text-[10px] font-bold {oMeta.badgeClass}"
											>
												{oMeta.label}
											</span>
											<span
												class="rounded-full border px-2 py-0.5 text-[10px] font-bold {pMeta.badgeClass}"
											>
												Bayar: {pMeta.label}
											</span>
										</div>
										<span class="text-[11px] text-muted-foreground tabular-nums">
											{new Date(ord.created_at).toLocaleString('id-ID', {
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>

									<div class="grid grid-cols-1 gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-2">
										<div>
											<span class="text-[11px] font-semibold text-muted-foreground">
												Belanja di
											</span>
											<p class="mt-0.5 text-sm font-bold text-foreground">{ord.origin_name}</p>
											{#if ord.origin_address}
												<p class="text-[11px] text-muted-foreground">{ord.origin_address}</p>
											{/if}
										</div>

										<div>
											<span class="text-[11px] font-semibold text-muted-foreground">
												Antar ke
											</span>
											<p class="mt-0.5 text-xs font-bold text-foreground">
												{ord.recipient_name} &middot;
												<a
													href="tel:{ord.recipient_phone}"
													class="text-primary tabular-nums hover:underline"
												>
													{ord.recipient_phone}
												</a>
											</p>
											<p class="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
												{formatCleanAddress(ord.destination_address_text)}
											</p>
										</div>
									</div>

									<div class="space-y-1.5">
										<div class="flex items-center justify-between">
											<span class="text-[11px] font-semibold text-muted-foreground">
												Daftar Belanja ({ord.items.length} item)
											</span>
											<span class="text-xs font-bold text-primary tabular-nums">
												Total: Rp {Number(ord.actual_total || ord.total_estimated).toLocaleString(
													'id-ID'
												)}
											</span>
										</div>
										<ul class="divide-y divide-border/50 rounded-lg border border-border/60 px-3">
											{#each ord.items as it (it.id)}
												<li class="flex items-baseline justify-between gap-2 py-2">
													<div class="min-w-0">
														<p class="font-semibold text-foreground">{it.name}</p>
														<p class="text-[11px] text-muted-foreground tabular-nums">
															{it.quantity}
															{it.unit}
															{#if it.estimated_price}
																&times; Rp {Number(it.estimated_price).toLocaleString('id-ID')}
															{/if}
															{#if it.notes}
																&middot; {it.notes}
															{/if}
														</p>
													</div>
													{#if it.estimated_price}
														<span class="shrink-0 font-semibold text-foreground tabular-nums">
															Rp {Number(it.estimated_price * it.quantity).toLocaleString('id-ID')}
														</span>
													{/if}
												</li>
											{/each}
										</ul>
										{#if ord.customer_notes}
											<div
												class="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200"
											>
												<strong>Catatan Pemesan:</strong>
												{ord.customer_notes}
											</div>
										{/if}
									</div>

									<div class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
										{#if ord.status === 'pending'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="shopping" />
												<Button size="sm" type="submit" class="h-9 text-xs font-semibold">
													Terima &amp; Belanjakan
												</Button>
											</form>
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="rejected" />
												<Button
													size="sm"
													variant="outline"
													type="submit"
													class="h-9 text-xs text-destructive hover:bg-destructive/10"
												>
													Tolak
												</Button>
											</form>
										{:else if ord.status === 'accepted'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="shopping" />
												<Button size="sm" type="submit" class="h-9 text-xs font-semibold">
													Mulai Belanja
												</Button>
											</form>
										{:else if ord.status === 'shopping'}
											<form
												method="POST"
												action="?/updateOrderStatus"
												use:enhance
												class="flex flex-wrap items-center gap-2"
											>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="delivering" />
												<Input
													name="actual_item_cost"
													type="number"
													min="0"
													step="500"
													placeholder="Total nota toko (Rp)"
													class="h-9 w-40 bg-background text-xs"
													required
												/>
												<Button size="sm" type="submit" class="h-9 text-xs font-semibold">
													Input Nota &amp; Antar
												</Button>
											</form>
										{:else if ord.status === 'purchased'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="delivering" />
												<Button size="sm" type="submit" class="h-9 text-xs font-semibold">
													Berangkat Antar
												</Button>
											</form>
										{:else if ord.status === 'delivering'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={ord.id} />
												<input type="hidden" name="to_status" value="completed" />
												<Button
													size="sm"
													type="submit"
													class="h-9 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
												>
													Selesaikan Pesanan
												</Button>
											</form>
										{/if}

										<a
											href={resolve('/pesanan/[id]', { id: ord.order_number })}
											class="ml-auto text-xs font-semibold text-primary hover:underline"
										>
											Detail &amp; Chat &rarr;
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<!-- PAYMENTS -->
			{#if activeTab === 'payments'}
				<section class="space-y-4">
					<div
						class="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<h2 class="text-base font-bold text-foreground">Verifikasi Pembayaran Manual</h2>
							<p class="text-xs text-muted-foreground">
								Bukti transfer tidak pernah otomatis lunas sebelum diverifikasi Admin.
							</p>
						</div>

						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => (paymentFilter = 'all')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {paymentFilter ===
								'all'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Semua ({data.payments.length})
							</button>
							<button
								type="button"
								onclick={() => (paymentFilter = 'pending')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {paymentFilter ===
								'pending'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Perlu Cek ({data.stats.awaitingPayments})
							</button>
							<button
								type="button"
								onclick={() => (paymentFilter = 'verified')}
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {paymentFilter ===
								'verified'
									? 'bg-primary font-semibold text-primary-foreground'
									: 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
							>
								Lunas
							</button>
						</div>
					</div>

					{#if filteredPayments.length === 0}
						<div
							class="rounded-xl border border-border/80 bg-card px-4 py-10 text-center text-xs text-muted-foreground"
						>
							Belum ada catatan pembayaran pada filter ini.
						</div>
					{:else}
						<div class="space-y-3">
							{#each filteredPayments as pay (pay.id)}
								{@const pMeta = PAYMENT_STATUS_LABELS[pay.status]}
								<div class="space-y-3 rounded-xl border border-border/80 bg-card p-4 text-xs">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<div class="flex flex-wrap items-center gap-2">
											<span class="font-mono font-bold text-foreground">
												{pay.payment_reference}
											</span>
											<span
												class="rounded-full border px-2 py-0.5 text-[10px] font-bold {pMeta.badgeClass}"
											>
												{pMeta.label}
											</span>
											<span
												class="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
											>
												{PAYMENT_METHOD_LABELS[pay.method].shortLabel}
											</span>
										</div>
										<a
											href={resolve('/pesanan/[id]', { id: pay.order_number || pay.order_id })}
											class="text-xs font-semibold text-primary hover:underline"
										>
											Detail Pesanan &rarr;
										</a>
									</div>

									<div
										class="grid grid-cols-1 gap-2 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-3"
									>
										<div>
											<span class="text-muted-foreground">Tagihan:</span>
											<strong class="ml-1 text-foreground tabular-nums">
												Rp {Number(pay.expected_amount).toLocaleString('id-ID')}
											</strong>
										</div>
										<div>
											<span class="text-muted-foreground">Pengirim:</span>
											<strong class="ml-1 text-foreground">{pay.payer_name || '-'}</strong>
										</div>
										<div>
											<span class="text-muted-foreground">Ref Eksternal:</span>
											<strong class="ml-1 font-mono text-foreground">
												{pay.external_reference || '-'}
											</strong>
										</div>
									</div>

									{#if pay.proofSignedUrl && pay.proof_mime_type?.startsWith('image/')}
										<img
											src={pay.proofSignedUrl}
											alt={pay.proof_file_name || 'Bukti transfer'}
											class="max-h-44 rounded-lg border border-border/60 bg-background object-contain"
										/>
									{/if}

									{#if pay.status === 'awaiting_verification' || pay.status === 'unpaid'}
										<div class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
											<form
												method="POST"
												action="?/verifyOrderPayment"
												use:enhance
												class="flex flex-wrap items-center gap-2"
											>
												<input type="hidden" name="order_id" value={pay.order_id} />
												<input
													type="number"
													name="paid_amount"
													value={pay.expected_amount}
													min="0"
													step="500"
													class="h-9 w-32 rounded-md border border-input bg-background px-2.5 text-xs tabular-nums"
													required
												/>
												<Button
													type="submit"
													size="sm"
													class="h-9 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
												>
													Verifikasi Lunas
												</Button>
											</form>

											{#if pay.status === 'awaiting_verification'}
												<form
													method="POST"
													action="?/rejectOrderPayment"
													use:enhance
													class="flex flex-wrap items-center gap-2"
												>
													<input type="hidden" name="order_id" value={pay.order_id} />
													<Input
														name="rejection_reason"
														type="text"
														placeholder="Alasan tolak..."
														required
														class="h-9 w-44 bg-background text-xs"
													/>
													<Button
														type="submit"
														size="sm"
														variant="destructive"
														class="h-9 text-xs font-semibold"
													>
														Tolak
													</Button>
												</form>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<!-- DISPUTES / REPORTS -->
			{#if activeTab === 'disputes'}
				<section class="rounded-xl border border-border/80 bg-card">
					<div class="border-b border-border/60 p-4">
						<h2 class="text-base font-bold text-foreground">
							Laporan &amp; Sengketa ({data.disputes.length})
						</h2>
						<p class="text-xs text-muted-foreground">
							Tindak lanjuti laporan kendala dari pelanggan maupun mitra.
						</p>
					</div>

					<div class="p-4">
						{#if data.disputes.length === 0}
							<div class="py-8 text-center text-xs text-muted-foreground">
								Belum ada laporan atau sengketa pesanan yang masuk.
							</div>
						{:else}
							<div class="space-y-3">
								{#each data.disputes as disp (disp.id)}
									<div class="space-y-3 rounded-xl border border-border/80 p-4">
										<div>
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-xs font-bold text-foreground">{disp.reason}</span>
												<Badge
													variant={disp.status === 'resolved'
														? 'secondary'
														: disp.status === 'open'
															? 'destructive'
															: 'outline'}
													class="text-[10px] uppercase"
												>
													{disp.status}
												</Badge>
											</div>
											<p class="mt-1 text-xs text-muted-foreground">{disp.description}</p>
											<div
												class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"
											>
												<span>Pelapor: {disp.reporter_name} ({disp.reporter_role})</span>
												<span>
													Pesanan:
													<a
														href={resolve('/pesanan/[id]', {
															id: disp.order_number || disp.order_id
														})}
														class="font-semibold text-primary underline"
													>
														{disp.order_number || disp.order_id.slice(0, 8)}
													</a>
												</span>
												<span>{new Date(disp.created_at).toLocaleString('id-ID')}</span>
											</div>
										</div>

										<form
											method="POST"
											action="?/updateDisputeStatus"
											class="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center"
											use:enhance={() => {
												isSubmitting = true;
												return async ({ update }) => {
													await update();
													isSubmitting = false;
												};
											}}
										>
											<input type="hidden" name="dispute_id" value={disp.id} />
											<select
												name="status"
												value={disp.status}
												class="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
											>
												<option value="open">Open</option>
												<option value="investigating">Investigating</option>
												<option value="resolved">Resolved</option>
												<option value="dismissed">Dismissed</option>
											</select>
											<Input
												name="resolution_note"
												value={disp.resolution_note || ''}
												placeholder="Catatan penyelesaian admin..."
												class="h-9 flex-1 text-xs"
											/>
											<Button
												type="submit"
												size="sm"
												disabled={isSubmitting}
												class="h-9 text-xs font-semibold"
											>
												Perbarui Status
											</Button>
										</form>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- CATEGORIES -->
			{#if activeTab === 'categories'}
				<section class="rounded-xl border border-border/80 bg-card">
					<div
						class="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<h2 class="text-base font-bold text-foreground">
								Kategori Layanan ({data.categories.length})
							</h2>
							<p class="text-xs text-muted-foreground">
								Daftar kategori belanja dan titipan yang tampil di beranda.
							</p>
						</div>
						<Button
							size="sm"
							onclick={openAddCategoryModal}
							class="h-9 gap-1.5 self-start text-xs font-semibold"
						>
							<Plus class="size-3.5" />
							<span>Tambah Kategori</span>
						</Button>
					</div>

					<div class="divide-y divide-border/60">
						{#each data.categories as cat (cat.id)}
							<div
								class="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
							>
								<div class="min-w-0 space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-sm font-bold text-foreground">{cat.name}</span>
										{#if cat.is_active}
											<Badge variant="default" class="text-[10px]">Aktif</Badge>
										{:else}
											<Badge variant="secondary" class="text-[10px]">Non-Aktif</Badge>
										{/if}
										<span class="text-[11px] text-muted-foreground tabular-nums">
											Urutan #{cat.sort_order}
										</span>
									</div>
									<p class="text-xs text-muted-foreground">
										{cat.description || 'Tidak ada deskripsi'}
									</p>
									<div class="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
										<span>
											Slug: <code class="rounded bg-muted px-1 font-mono text-[10px]">
												{cat.slug}
											</code>
										</span>
										<span>
											Ikon: <code class="rounded bg-muted px-1 font-mono text-[10px]">
												{cat.icon || 'default'}
											</code>
										</span>
									</div>
								</div>

								<div class="flex shrink-0 items-center gap-2">
									<form
										method="POST"
										action="?/toggleCategoryActive"
										use:enhance={() => {
											isSubmitting = true;
											return async ({ update }) => {
												await update();
												isSubmitting = false;
											};
										}}
									>
										<input type="hidden" name="id" value={cat.id} />
										<input type="hidden" name="current_status" value={String(cat.is_active)} />
										<Button
											type="submit"
											variant={cat.is_active ? 'outline' : 'secondary'}
											size="sm"
											disabled={isSubmitting}
											class="h-9 gap-1 px-2.5 text-xs"
										>
											<Power class="size-3.5" />
											<span>{cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
										</Button>
									</form>

									<Button
										variant="outline"
										size="sm"
										onclick={() => openEditCategoryModal(cat)}
										class="h-9 gap-1 px-2.5 text-xs"
									>
										<Pencil class="size-3.5" />
										<span>Edit</span>
									</Button>

									<form
										method="POST"
										action="?/deleteCategory"
										use:enhance={() => {
											isSubmitting = true;
											return async ({ update }) => {
												await update();
												isSubmitting = false;
											};
										}}
									>
										<input type="hidden" name="id" value={cat.id} />
										<Button
											type="submit"
											variant="ghost"
											size="sm"
											disabled={isSubmitting}
											class="h-9 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
											aria-label="Hapus Kategori"
										>
											<Trash2 class="size-4" />
										</Button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- USERS & PROVIDERS -->
			{#if activeTab === 'users'}
				<section class="space-y-5">
					<!-- Provider Moderation -->
					<div class="rounded-xl border border-border/80 bg-card">
						<div class="border-b border-border/60 p-4">
							<h2 class="flex items-center gap-2 text-base font-bold text-foreground">
								<BadgeCheck class="size-4 text-primary" />
								<span>Moderasi Mitra &amp; Kurir ({data.providers.length})</span>
							</h2>
							<p class="text-xs text-muted-foreground">
								Verifikasi akun mitra dan kelola status aktif layanan mereka.
							</p>
						</div>

						{#if data.providers.length === 0}
							<div class="px-4 py-8 text-center text-xs text-muted-foreground">
								Belum ada profil mitra yang terdaftar.
							</div>
						{:else}
							<div class="divide-y divide-border/60">
								{#each data.providers as prov (prov.id)}
									<div class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-xs font-bold text-foreground">
													{prov.business_name}
												</span>
												{#if prov.is_verified}
													<Badge class="bg-emerald-600 text-[10px] text-white">Terverifikasi</Badge>
												{:else}
													<Badge variant="outline" class="text-[10px]">Belum Verifikasi</Badge>
												{/if}
												{#if prov.is_active}
													<Badge variant="secondary" class="text-[10px]">Aktif</Badge>
												{:else}
													<Badge variant="destructive" class="text-[10px]">Nonaktif</Badge>
												{/if}
											</div>
											<div
												class="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"
											>
												<span>Pemilik: {prov.full_name}</span>
												<span>Area: {prov.coverage_area || '-'}</span>
												<span>Layanan: {prov.services_count}</span>
												<span>
													Rating: {Number(prov.rating_avg).toFixed(1)} ({prov.rating_count})
												</span>
											</div>
										</div>

										<div class="flex shrink-0 flex-wrap items-center gap-2">
											<form
												method="POST"
												action="?/moderateProvider"
												use:enhance={() => {
													isSubmitting = true;
													return async ({ update }) => {
														await update();
														isSubmitting = false;
													};
												}}
											>
												<input type="hidden" name="provider_id" value={prov.id} />
												<input type="hidden" name="is_verified" value={String(!prov.is_verified)} />
												<Button
													type="submit"
													variant="outline"
													size="sm"
													disabled={isSubmitting}
													class="h-9 text-xs"
												>
													{prov.is_verified ? 'Cabut Verifikasi' : 'Verifikasi Mitra'}
												</Button>
											</form>
											<form
												method="POST"
												action="?/moderateProvider"
												use:enhance={() => {
													isSubmitting = true;
													return async ({ update }) => {
														await update();
														isSubmitting = false;
													};
												}}
											>
												<input type="hidden" name="provider_id" value={prov.id} />
												<input type="hidden" name="is_active" value={String(!prov.is_active)} />
												<Button
													type="submit"
													variant={prov.is_active ? 'destructive' : 'default'}
													size="sm"
													disabled={isSubmitting}
													class="h-9 text-xs"
												>
													{prov.is_active ? 'Nonaktifkan' : 'Aktifkan'}
												</Button>
											</form>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Users List -->
					<div class="rounded-xl border border-border/80 bg-card">
						<div class="border-b border-border/60 p-4">
							<h2 class="text-base font-bold text-foreground">
								Daftar Pengguna &amp; Hak Akses ({data.users.length})
							</h2>
							<p class="text-xs text-muted-foreground">
								Pantau akun terdaftar dan ubah peran pengguna secara langsung.
							</p>
						</div>

						{#if data.users.length === 0}
							<div class="px-4 py-8 text-center text-xs text-muted-foreground">
								Belum ada akun yang terdaftar.
							</div>
						{:else}
							<div class="divide-y divide-border/60">
								{#each data.users as u (u.id)}
									<div class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-xs font-bold text-foreground">{u.full_name}</span>
												{#if u.role === 'admin'}
													<Badge variant="destructive" class="text-[10px]">Owner / Admin</Badge>
												{:else if u.role === 'provider'}
													<Badge variant="secondary" class="text-[10px]">Mitra Jastip</Badge>
												{:else}
													<Badge variant="outline" class="text-[10px]">Pelanggan</Badge>
												{/if}
											</div>
											<div
												class="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"
											>
												<span>
													ID: <code class="font-mono text-[10px]">{u.id.slice(0, 8)}...</code>
												</span>
												<span>Telp: {u.phone || 'Tidak dicantumkan'}</span>
											</div>
										</div>

										<form
											method="POST"
											action="?/updateUserRole"
											class="flex shrink-0 items-center gap-2"
											use:enhance={() => {
												isSubmitting = true;
												return async ({ update }) => {
													await update();
													isSubmitting = false;
												};
											}}
										>
											<input type="hidden" name="user_id" value={u.id} />
											<select
												name="role"
												value={u.role}
												class="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
											>
												<option value="customer">Pelanggan</option>
												<option value="provider">Mitra</option>
												<option value="admin">Admin / Owner</option>
											</select>
											<Button
												type="submit"
												variant="outline"
												size="sm"
												disabled={isSubmitting}
												class="h-9 text-xs"
											>
												Ubah
											</Button>
										</form>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- SETTINGS & PRICING RULES -->
			{#if activeTab === 'settings'}
				<section class="space-y-5">
					<div class="rounded-xl border border-border/80 bg-card p-5">
						<h2 class="text-base font-bold text-foreground">Konfigurasi Operasional Platform</h2>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Kelola izin pendaftaran mitra, kontak CS, dan status operasional sistem.
						</p>

						<form
							method="POST"
							action="?/updateSettings"
							class="mt-4 max-w-2xl space-y-4"
							use:enhance={() => {
								isSubmitting = true;
								return async ({ update }) => {
									await update();
									isSubmitting = false;
								};
							}}
						>
							<label
								for="allow_provider"
								class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4"
							>
								<div>
									<span class="text-xs font-bold text-foreground">
										Buka Pendaftaran Mitra (Provider)
									</span>
									<p class="text-[11px] text-muted-foreground">
										Jika dimatikan, calon pengguna hanya bisa mendaftar sebagai Pelanggan.
									</p>
								</div>
								<input
									type="checkbox"
									id="allow_provider"
									name="allow_provider_registration"
									checked={data.settings.allow_provider_registration}
									class="size-5 shrink-0 rounded border-border text-primary focus:ring-primary"
								/>
							</label>

							<div class="grid gap-4 sm:grid-cols-2">
								<div class="space-y-1.5">
									<Label for="platform_name" class="text-xs font-semibold">Nama Platform</Label>
									<Input
										id="platform_name"
										name="platform_name"
										value={data.settings.platform_name}
										class="h-9 text-xs"
									/>
								</div>

								<div class="space-y-1.5">
									<Label for="support_phone" class="text-xs font-semibold">
										Nomor WhatsApp CS / Admin
									</Label>
									<Input
										id="support_phone"
										name="support_phone"
										value={data.settings.support_phone}
										class="h-9 text-xs"
									/>
								</div>
							</div>

							<div class="space-y-1.5">
								<Label for="operational_status" class="text-xs font-semibold">
									Status Operasional
								</Label>
								<select
									id="operational_status"
									name="operational_status"
									value={data.settings.operational_status}
									class="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
								>
									<option value="active">Berjalan Normal (Aktif)</option>
									<option value="maintenance">Mode Pemeliharaan (Maintenance)</option>
									<option value="paused">Operasional Dijeda Sementara</option>
								</select>
							</div>

							<div class="pt-1">
								<Button
									type="submit"
									size="sm"
									disabled={isSubmitting}
									class="h-9 text-xs font-semibold"
								>
									{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
								</Button>
							</div>
						</form>
					</div>

					<!-- Pricing Rules -->
					<div class="rounded-xl border border-border/80 bg-card p-5">
						<h2 class="text-base font-bold text-foreground">Pengaturan Aturan Tarif</h2>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Sesuaikan tarif dasar, jarak dasar, tarif per km, dan biaya platform.
						</p>

						<div class="mt-4 space-y-4">
							{#each data.pricingRules as rule (rule.id)}
								<form
									method="POST"
									action="?/updatePricingRule"
									class="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ update }) => {
											await update();
											isSubmitting = false;
										};
									}}
								>
									<input type="hidden" name="id" value={rule.id} />
									<div class="flex flex-wrap items-center justify-between gap-2">
										<div class="flex items-center gap-2">
											<Badge variant="outline" class="font-mono text-[10px]">{rule.id}</Badge>
											<Badge variant="secondary" class="text-[10px]">{rule.model}</Badge>
										</div>
										<label class="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
											<input
												type="checkbox"
												name="is_active"
												checked={rule.is_active}
												class="size-4 rounded border-border text-primary"
											/>
											<span>Aktif</span>
										</label>
									</div>

									<div class="grid gap-3 sm:grid-cols-3">
										<div class="space-y-1 sm:col-span-3">
											<Label class="text-[11px] font-semibold">Nama Aturan</Label>
											<Input name="name" value={rule.name} class="h-9 text-xs" required />
										</div>
										<div class="space-y-1">
											<Label class="text-[11px] font-semibold">Tarif Dasar (Rp)</Label>
											<Input
												type="number"
												name="base_fee"
												value={rule.base_fee}
												min="0"
												step="500"
												class="h-9 text-xs tabular-nums"
												required
											/>
										</div>
										<div class="space-y-1">
											<Label class="text-[11px] font-semibold">Jarak Dasar (km)</Label>
											<Input
												type="number"
												name="base_distance_km"
												value={rule.base_distance_km}
												min="0"
												step="0.5"
												class="h-9 text-xs tabular-nums"
												required
											/>
										</div>
										<div class="space-y-1">
											<Label class="text-[11px] font-semibold">Tarif / km (Rp)</Label>
											<Input
												type="number"
												name="per_km_fee"
												value={rule.per_km_fee}
												min="0"
												step="500"
												class="h-9 text-xs tabular-nums"
												required
											/>
										</div>
										<div class="space-y-1">
											<Label class="text-[11px] font-semibold">Biaya Platform (Rp)</Label>
											<Input
												type="number"
												name="platform_fee"
												value={rule.platform_fee}
												min="0"
												step="500"
												class="h-9 text-xs tabular-nums"
												required
											/>
										</div>
										<div class="space-y-1">
											<Label class="text-[11px] font-semibold">Minimum Order Fee (Rp)</Label>
											<Input
												type="number"
												name="min_order_fee"
												value={rule.min_order_fee}
												min="0"
												step="500"
												class="h-9 text-xs tabular-nums"
												required
											/>
										</div>
									</div>

									<div class="flex justify-end pt-1">
										<Button
											type="submit"
											size="sm"
											variant="outline"
											disabled={isSubmitting}
											class="h-9 text-xs font-semibold"
										>
											Simpan Aturan
										</Button>
									</div>
								</form>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- AUDIT LOGS -->
			{#if activeTab === 'audit'}
				<section class="rounded-xl border border-border/80 bg-card">
					<div class="border-b border-border/60 p-4">
						<h2 class="text-base font-bold text-foreground">
							Audit Log Aktivitas Admin ({data.auditLogs.length})
						</h2>
						<p class="text-xs text-muted-foreground">
							Jejak audit append-only untuk seluruh tindakan konfigurasi, moderasi, dan verifikasi.
						</p>
					</div>

					{#if data.auditLogs.length === 0}
						<div class="px-4 py-10 text-center text-xs text-muted-foreground">
							Belum ada catatan aktivitas admin.
						</div>
					{:else}
						<div class="divide-y divide-border/60">
							{#each data.auditLogs as log (log.id)}
								<div class="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
									<div class="min-w-0 space-y-1">
										<div class="flex flex-wrap items-center gap-2">
											<Badge variant="outline" class="font-mono text-[10px]">{log.action}</Badge>
											<span class="text-xs font-semibold text-foreground">
												{log.actor_name || 'Admin'}
											</span>
											<span class="text-[11px] text-muted-foreground">
												&rarr; {log.target_type}{log.target_id
													? ` (${log.target_id.slice(0, 12)})`
													: ''}
											</span>
										</div>
										{#if log.metadata && Object.keys(log.metadata).length > 0}
											<p class="truncate font-mono text-[10px] text-muted-foreground">
												{JSON.stringify(log.metadata)}
											</p>
										{/if}
									</div>
									<span class="shrink-0 text-[11px] text-muted-foreground tabular-nums">
										{new Date(log.created_at).toLocaleString('id-ID')}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}
		</main>
	</div>
</div>

<!-- Modal: Add / Edit Category Dialog -->
<Dialog.Root bind:open={isCategoryModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-base font-bold">
				{editingCategory ? 'Edit Kategori Layanan' : 'Tambah Kategori Layanan Baru'}
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				Konfigurasi kategori layanan untuk ditampilkan di beranda dan halaman eksplorasi.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/saveCategory"
			class="space-y-4 pt-2"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					isCategoryModalOpen = false;
				};
			}}
		>
			{#if editingCategory}
				<input type="hidden" name="id" value={editingCategory.id} />
			{/if}

			<div class="space-y-1.5">
				<Label for="cat-name" class="text-xs font-semibold">Nama Kategori</Label>
				<Input
					id="cat-name"
					name="name"
					required
					value={editingCategory?.name ?? ''}
					placeholder="Contoh: Kuliner & Minuman"
					class="text-xs"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="cat-slug" class="text-xs font-semibold">Slug URL</Label>
				<Input
					id="cat-slug"
					name="slug"
					required
					value={editingCategory?.slug ?? ''}
					placeholder="contoh: food-beverage"
					class="text-xs"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="cat-desc" class="text-xs font-semibold">Deskripsi</Label>
				<Textarea
					id="cat-desc"
					name="description"
					rows={3}
					value={editingCategory?.description ?? ''}
					placeholder="Deskripsi singkat jenis titipan pada kategori ini"
					class="text-xs"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<Label for="cat-icon" class="text-xs font-semibold">Nama Ikon</Label>
					<Input
						id="cat-icon"
						name="icon"
						value={editingCategory?.icon ?? 'shopping-bag'}
						placeholder="utensils, store, carrot..."
						class="text-xs"
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="cat-sort" class="text-xs font-semibold">Urutan Tampil</Label>
					<Input
						id="cat-sort"
						type="number"
						name="sort_order"
						value={editingCategory?.sort_order ?? 0}
						class="text-xs"
					/>
				</div>
			</div>

			<div class="flex items-center gap-2 pt-2">
				<input
					type="checkbox"
					id="cat-active"
					name="is_active"
					checked={editingCategory ? editingCategory.is_active : true}
					class="size-4 rounded border-border text-primary focus:ring-primary"
				/>
				<Label for="cat-active" class="cursor-pointer text-xs font-medium">
					Aktifkan kategori ini untuk publik
				</Label>
			</div>

			<Dialog.Footer class="pt-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={() => (isCategoryModalOpen = false)}
				>
					Batal
				</Button>
				<Button type="submit" size="sm" disabled={isSubmitting}>
					{isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
