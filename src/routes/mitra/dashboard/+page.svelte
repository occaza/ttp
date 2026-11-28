<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Select } from '#lib/components/ui/select/index.js';
	import {
		AlertCircle,
		CheckCircle2,
		Edit3,
		MapPin,
		Plus,
		Power,
		ShoppingBag,
		Star,
		Store,
		Trash2,
		Wallet
	} from 'lucide-svelte';
	import { ORDER_STATUS_LABELS, formatCleanAddress } from '#lib/constants/order.js';
	import { PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import type { ProviderService } from '#lib/types/database.types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type MitraTab = 'orders' | 'services' | 'earnings' | 'profile';
	type OrderFilter = 'active' | 'pending' | 'all' | 'completed';

	let activeTab = $state<MitraTab>('orders');
	let orderFilter = $state<OrderFilter>('all');

	const orderFilters: { id: OrderFilter; label: string }[] = [
		{ id: 'all', label: 'Semua' },
		{ id: 'pending', label: 'Menunggu' },
		{ id: 'active', label: 'Berjalan' },
		{ id: 'completed', label: 'Selesai' }
	];

	let isServiceModalOpen = $state(false);
	let editingService = $state<ProviderService | null>(null);
	let savingService = $state(false);
	let serviceModalError = $state('');
	let confirmDeleteServiceId = $state<string | null>(null);
	let isEditingProfile = $state(false);

	// Form fields for service modal
	let serviceId = $state('');
	let categoryId = $state('');
	let serviceTitle = $state('');
	let serviceDescription = $state('');
	let serviceBaseFee = $state(8000);
	let serviceCoverage = $state('Gatak, Gawok, Trangsan, Mayang');
	let serviceIsActive = $state(true);

	function openAddServiceModal() {
		editingService = null;
		serviceModalError = '';
		serviceId = '';
		categoryId = data.categories[0]?.id || '';
		serviceTitle = '';
		serviceDescription = '';
		serviceBaseFee = 8000;
		serviceCoverage = data.providerProfile?.coverage_area || 'Gatak, Gawok, Trangsan, Mayang';
		serviceIsActive = true;
		isServiceModalOpen = true;
	}

	function openEditServiceModal(s: ProviderService) {
		editingService = s;
		serviceModalError = '';
		serviceId = s.id;
		categoryId = s.category_id;
		serviceTitle = s.title;
		serviceDescription = s.description || '';
		serviceBaseFee = Number(s.base_fee);
		serviceCoverage = s.coverage_area;
		serviceIsActive = s.is_active;
		isServiceModalOpen = true;
	}

	const categoryMap = $derived(new Map(data.categories.map((c) => [c.id, c.name])));

	const openOrdersCount = $derived(data.stats.pendingOrdersCount + data.stats.activeOrdersCount);

	const filteredOrders = $derived.by(() => {
		if (orderFilter === 'pending') {
			return data.orders.filter((o) => o.status === 'pending');
		}
		if (orderFilter === 'active') {
			return data.orders.filter((o) =>
				['pending', 'accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
			);
		}
		if (orderFilter === 'completed') {
			return data.orders.filter((o) => ['completed', 'cancelled', 'rejected'].includes(o.status));
		}
		return data.orders;
	});

	const navGroups = $derived([
		{
			label: 'Operasional',
			items: [
				{
					id: 'orders' as MitraTab,
					label: 'Pesanan',
					icon: ShoppingBag,
					badge: openOrdersCount
				},
				{
					id: 'services' as MitraTab,
					label: 'Layanan Jastip',
					icon: Store,
					badge: data.stats.activeServices
				}
			]
		},
		{
			label: 'Usaha',
			items: [
				{
					id: 'earnings' as MitraTab,
					label: 'Pendapatan',
					icon: Wallet,
					badge: 0
				},
				{
					id: 'profile' as MitraTab,
					label: 'Profil Usaha',
					icon: MapPin,
					badge: 0
				}
			]
		}
	]);
</script>

<svelte:head>
	<title>Dashboard Mitra - Titipin</title>
	<meta
		name="description"
		content="Area kerja mitra jastip: kelola pesanan masuk, penawaran layanan, tarif dasar, dan pendapatan."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
	<!-- Compact Operate-Mode Header -->
	<header
		class="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="min-w-0">
			<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Dashboard Mitra</h1>
			<p class="mt-0.5 truncate text-xs text-muted-foreground">
				{data.providerProfile?.business_name || 'Mitra Jastip'} &middot;
				<span
					class="font-semibold {data.providerProfile?.is_active
						? 'text-emerald-600'
						: 'text-amber-600'}"
				>
					{data.providerProfile?.is_active ? 'Buka (Menerima Pesanan)' : 'Tutup Sementara'}
				</span>
			</p>
		</div>

		<div class="flex shrink-0 flex-wrap items-center gap-2">
			<form method="POST" action="?/toggleAvailability" use:enhance>
				<input
					type="hidden"
					name="current_status"
					value={String(data.providerProfile?.is_active)}
				/>
				<Button
					type="submit"
					size="sm"
					variant={data.providerProfile?.is_active ? 'outline' : 'default'}
					class="h-9 gap-1.5 text-xs font-semibold"
				>
					<Power class="size-3.5" />
					<span>{data.providerProfile?.is_active ? 'Tutup Pesanan' : 'Buka Pesanan'}</span>
				</Button>
			</form>

			{#if data.role === 'admin'}
				<Button variant="outline" size="sm" href={resolve('/admin')} class="h-9 text-xs">
					Admin Console
				</Button>
			{/if}

			<Button variant="outline" size="sm" href={resolve('/profil')} class="h-9 text-xs">
				Profil
			</Button>
		</div>
	</header>

	<!-- Feedback Banners -->
	{#if form?.serviceSuccess || form?.providerSuccess}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.serviceSuccess || form.providerSuccess}</span>
		</div>
	{/if}

	{#if form?.serviceError || form?.providerError}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.serviceError || form.providerError}</span>
		</div>
	{/if}

	<!-- Main Layout: Sidebar Rail (Desktop) + Mobile Grid Nav + Active Workspace -->
	<div class="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
		<!-- Mobile Navigation (2-column grid, zero horizontal scroll) -->
		<nav class="grid grid-cols-2 gap-1.5 lg:hidden" aria-label="Menu Mitra">
			{#each navGroups as group (group.label)}
				{#each group.items as item (item.id)}
					{@const Icon = item.icon}
					{@const isActive = activeTab === item.id}
					<button
						type="button"
						onclick={() => (activeTab = item.id)}
						class="flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors duration-150 {isActive
							? 'border-primary/40 bg-primary/10 text-primary'
							: 'border-border/70 bg-card text-foreground hover:bg-muted/50'}"
					>
						<span class="flex min-w-0 items-center gap-2">
							<Icon class="size-4 shrink-0" />
							<span class="truncate">{item.label}</span>
						</span>
						{#if item.badge > 0}
							<span
								class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums {isActive
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-foreground'}"
							>
								{item.badge}
							</span>
						{/if}
					</button>
				{/each}
			{/each}
		</nav>

		<!-- Desktop Sticky Sidebar Rail -->
		<aside class="hidden w-56 shrink-0 lg:block">
			<nav class="sticky top-20 space-y-5" aria-label="Menu Mitra">
				{#each navGroups as group (group.label)}
					<div>
						<p class="mb-1.5 px-2.5 text-[11px] font-semibold text-muted-foreground">
							{group.label}
						</p>
						<div class="space-y-0.5">
							{#each group.items as item (item.id)}
								{@const Icon = item.icon}
								{@const isActive = activeTab === item.id}
								<button
									type="button"
									onclick={() => (activeTab = item.id)}
									class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150 {isActive
										? 'bg-primary/10 font-semibold text-primary'
										: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
								>
									<span class="flex items-center gap-2.5">
										<Icon class="size-4 shrink-0" />
										<span>{item.label}</span>
									</span>
									{#if item.badge > 0}
										<span
											class="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums {isActive
												? 'bg-primary text-primary-foreground'
												: 'bg-muted text-foreground'}"
										>
											{item.badge}
										</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</nav>
		</aside>

		<!-- Workspace Content -->
		<div class="min-w-0 flex-1">
			<!-- TAB: PESANAN -->
			{#if activeTab === 'orders'}
				<section class="space-y-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 class="text-base font-bold text-foreground">Pesanan Masuk &amp; Aktif</h2>
							<p class="text-xs text-muted-foreground">
								Terima titipan, input total struk kasir toko, lalu selesaikan pengantaran.
							</p>
						</div>

						<div
							class="flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/30 p-1"
						>
							{#each orderFilters as f (f.id)}
								<button
									type="button"
									onclick={() => (orderFilter = f.id)}
									class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 {orderFilter ===
									f.id
										? 'bg-background font-semibold text-foreground shadow-2xs'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									{f.label}
								</button>
							{/each}
						</div>
					</div>

					{#if filteredOrders.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-12 text-center"
						>
							<ShoppingBag class="size-7 text-muted-foreground/60" />
							<p class="mt-3 text-sm font-semibold text-foreground">
								Belum ada pesanan pada filter ini
							</p>
							<p class="mt-1 max-w-sm text-xs text-muted-foreground">
								Pastikan status operasional Anda dalam keadaan Buka dan penawaran layanan aktif agar
								pelanggan bisa memesan.
							</p>
							<Button
								variant="outline"
								size="sm"
								onclick={() => (activeTab = 'services')}
								class="mt-4 h-9 text-xs font-semibold"
							>
								Kelola Layanan Jastip
							</Button>
						</div>
					{:else}
						<div class="space-y-4">
							{#each filteredOrders as order (order.id)}
								{@const statusMeta = ORDER_STATUS_LABELS[order.status] || {
									label: order.status,
									badgeClass: 'bg-muted text-muted-foreground'
								}}
								{@const payMeta = PAYMENT_STATUS_LABELS[order.paymentStatus]}
								<article class="space-y-3.5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
									<!-- Order Header -->
									<div
										class="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="flex flex-wrap items-center gap-2">
											<span class="font-mono text-xs font-bold text-foreground tabular-nums">
												{order.order_number}
											</span>
											<span
												class="rounded-full border px-2 py-0.5 text-[11px] font-semibold {statusMeta.badgeClass}"
											>
												{statusMeta.label}
											</span>
											<span
												class="rounded-full border px-2 py-0.5 text-[11px] font-semibold {payMeta.badgeClass}"
											>
												Bayar: {payMeta.label}
											</span>
										</div>
										<span class="text-xs text-muted-foreground tabular-nums">
											{new Date(order.created_at).toLocaleDateString('id-ID', {
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>

									<!-- Origin & Destination -->
									<div class="grid grid-cols-1 gap-3 border-b border-border/50 pb-3 sm:grid-cols-2">
										<div>
											<span class="block text-[11px] font-semibold text-muted-foreground">
												Beli di Toko
											</span>
											<p class="mt-0.5 text-sm font-bold text-foreground">{order.origin_name}</p>
										</div>
										<div>
											<span class="block text-[11px] font-semibold text-muted-foreground">
												Pemesan &amp; Tujuan Antar
											</span>
											<p class="mt-0.5 text-xs font-bold text-foreground">
												{order.recipient_name} &middot;
												<a
													href="tel:{order.recipient_phone}"
													class="text-primary tabular-nums hover:underline"
												>
													{order.recipient_phone}
												</a>
											</p>
											<p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
												{formatCleanAddress(order.destination_address_text)}
											</p>
										</div>
									</div>

									<!-- Shopping List -->
									<div class="space-y-2">
										<span class="block text-[11px] font-semibold text-muted-foreground">
											Daftar Belanja ({order.items.length} item)
										</span>
										<ul class="divide-y divide-border/40 text-xs">
											{#each order.items as it (it.id)}
												<li class="flex items-start justify-between gap-3 py-1.5">
													<div class="min-w-0 space-y-0.5">
														<div class="flex items-baseline gap-2">
															<span
																class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary tabular-nums"
															>
																{it.quantity}
																{it.unit}
															</span>
															<span class="font-semibold text-foreground">{it.name}</span>
														</div>
														{#if it.notes}
															<p class="text-[11px] text-amber-700 dark:text-amber-300">
																Catatan: {it.notes}
															</p>
														{/if}
													</div>
													{#if it.estimated_price}
														<span class="shrink-0 font-semibold text-foreground tabular-nums">
															Rp {Number(it.estimated_price * it.quantity).toLocaleString('id-ID')}
														</span>
													{/if}
												</li>
											{/each}
										</ul>

										{#if order.customer_notes}
											<div
												class="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
											>
												<strong>Catatan Pemesan:</strong>
												{order.customer_notes}
											</div>
										{/if}
									</div>

									<!-- Order Actions -->
									<div class="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
										{#if order.status === 'pending'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={order.id} />
												<input type="hidden" name="to_status" value="shopping" />
												<Button size="sm" type="submit" class="h-9 text-xs font-bold">
													Terima &amp; Belanjakan
												</Button>
											</form>
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={order.id} />
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
										{:else if order.status === 'accepted'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={order.id} />
												<input type="hidden" name="to_status" value="shopping" />
												<Button size="sm" type="submit" class="h-9 text-xs font-bold">
													Mulai Belanja
												</Button>
											</form>
										{:else if order.status === 'shopping'}
											<form
												method="POST"
												action="?/updateOrderStatus"
												use:enhance
												class="flex flex-wrap items-center gap-2"
											>
												<input type="hidden" name="order_id" value={order.id} />
												<input type="hidden" name="to_status" value="delivering" />
												<Input
													name="actual_item_cost"
													type="number"
													min="0"
													step="500"
													placeholder="Total nota toko (Rp)"
													class="h-9 w-40 text-base tabular-nums sm:text-xs"
													required
												/>
												<Button size="sm" type="submit" class="h-9 text-xs font-bold">
													Input Nota &amp; Antar
												</Button>
											</form>
										{:else if order.status === 'purchased'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={order.id} />
												<input type="hidden" name="to_status" value="delivering" />
												<Button size="sm" type="submit" class="h-9 text-xs font-bold">
													Berangkat Antar
												</Button>
											</form>
										{:else if order.status === 'delivering'}
											<form method="POST" action="?/updateOrderStatus" use:enhance>
												<input type="hidden" name="order_id" value={order.id} />
												<input type="hidden" name="to_status" value="completed" />
												<Button
													size="sm"
													type="submit"
													class="h-9 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
												>
													Selesaikan Pesanan
												</Button>
											</form>
										{/if}

										<a
											href={resolve('/pesanan/[id]', { id: order.order_number })}
											class="ml-auto inline-flex min-h-9 items-center text-xs font-semibold text-primary hover:underline"
										>
											Lihat Detail &rarr;
										</a>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</section>

				<!-- TAB: LAYANAN JASTIP -->
			{:else if activeTab === 'services'}
				<section class="space-y-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 class="text-base font-bold text-foreground">Daftar Layanan Jastip</h2>
							<p class="text-xs text-muted-foreground">
								{data.stats.activeServices} aktif dari {data.stats.totalServices} layanan terdaftar &middot;
								rata-rata tarif Rp {data.stats.avgBaseFee.toLocaleString('id-ID')}
							</p>
						</div>

						<Button
							size="sm"
							class="h-9 gap-1.5 text-xs font-semibold"
							onclick={openAddServiceModal}
						>
							<Plus class="size-3.5" />
							<span>Tambah Layanan</span>
						</Button>
					</div>

					{#if data.services.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-12 text-center"
						>
							<Store class="size-7 text-muted-foreground/60" />
							<h3 class="mt-3 text-sm font-bold text-foreground">Belum ada penawaran layanan</h3>
							<p class="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
								Tambahkan layanan jastip (misal: Jastip Soto Gawok atau Belanja Pasar) agar tampil
								di pencarian pelanggan.
							</p>
							<Button
								size="sm"
								class="mt-4 h-9 gap-1.5 text-xs font-semibold"
								onclick={openAddServiceModal}
							>
								<Plus class="size-3.5" />
								<span>Tambah Layanan Pertama</span>
							</Button>
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#each data.services as service (service.id)}
								<article
									class="flex flex-col justify-between rounded-2xl border p-4 transition-colors duration-150 {service.is_active
										? 'border-border/80 bg-card'
										: 'border-border/50 bg-muted/30 opacity-80'}"
								>
									<div class="space-y-2">
										<div class="flex items-center justify-between gap-2">
											<span
												class="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
											>
												{categoryMap.get(service.category_id) || 'Kategori Jastip'}
											</span>
											<span
												class="rounded-full px-2 py-0.5 text-[11px] font-semibold {service.is_active
													? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
													: 'bg-muted text-muted-foreground'}"
											>
												{service.is_active ? 'Aktif' : 'Non-aktif'}
											</span>
										</div>

										<h3 class="text-sm font-bold text-foreground">{service.title}</h3>

										{#if service.description}
											<p class="line-clamp-2 text-xs text-muted-foreground">
												{service.description}
											</p>
										{/if}

										<div class="flex items-baseline gap-1.5 border-t border-border/50 pt-2">
											<span class="text-xs text-muted-foreground">Tarif Flat:</span>
											<span class="text-sm font-bold text-primary tabular-nums">
												Rp {Number(service.base_fee).toLocaleString('id-ID')}
											</span>
										</div>

										<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
											<MapPin class="size-3.5 shrink-0 text-primary" />
											<span class="truncate">{service.coverage_area}</span>
										</div>
									</div>

									<div
										class="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3"
									>
										<form method="POST" action="?/toggleServiceActive" use:enhance>
											<input type="hidden" name="id" value={service.id} />
											<button
												type="submit"
												class="min-h-8 text-xs font-semibold {service.is_active
													? 'text-amber-700 hover:underline dark:text-amber-300'
													: 'text-emerald-700 hover:underline dark:text-emerald-300'}"
											>
												{service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
											</button>
										</form>

										<div class="flex items-center gap-1.5">
											<button
												type="button"
												class="inline-flex h-8 items-center rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
												onclick={() => openEditServiceModal(service)}
											>
												<Edit3 class="mr-1 size-3" />
												<span>Edit</span>
											</button>

											{#if confirmDeleteServiceId === service.id}
												<div class="flex items-center gap-1">
													<form method="POST" action="?/deleteService" use:enhance>
														<input type="hidden" name="id" value={service.id} />
														<button
															type="submit"
															class="inline-flex h-8 items-center rounded-lg bg-destructive px-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
														>
															Hapus
														</button>
													</form>
													<button
														type="button"
														onclick={() => (confirmDeleteServiceId = null)}
														class="inline-flex h-8 items-center rounded-lg border border-border/70 px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
													>
														Batal
													</button>
												</div>
											{:else}
												<button
													type="button"
													onclick={() => (confirmDeleteServiceId = service.id)}
													class="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
													aria-label="Hapus {service.title}"
													title="Hapus Layanan"
												>
													<Trash2 class="size-3.5" />
												</button>
											{/if}
										</div>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</section>

				<!-- TAB: PENDAPATAN -->
			{:else if activeTab === 'earnings'}
				<section class="space-y-5">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 class="text-base font-bold text-foreground">
								Pendapatan Jasa &amp; Riwayat Order
							</h2>
							<p class="text-xs text-muted-foreground">
								Dihitung dari order selesai. Pencairan hanya dicatat jika terverifikasi di tabel
								payout.
							</p>
						</div>
						<span class="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
							{data.earnings.completedOrdersCount} Selesai
						</span>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div class="rounded-2xl border border-border/80 bg-card p-4">
							<span class="block text-xs text-muted-foreground">Pendapatan Jasa Netto</span>
							<p class="mt-1 text-xl font-bold text-primary tabular-nums">
								Rp {data.earnings.netProviderEarnings.toLocaleString('id-ID')}
							</p>
							<span class="text-[11px] text-muted-foreground tabular-nums">
								Kotor Rp {data.earnings.grossServiceFees.toLocaleString('id-ID')} &minus; Platform Rp
								{data.earnings.platformFees.toLocaleString('id-ID')}
							</span>
						</div>

						<div class="rounded-2xl border border-border/80 bg-card p-4">
							<span class="block text-xs text-muted-foreground">Reimburse Belanja Toko</span>
							<p class="mt-1 text-xl font-bold text-foreground tabular-nums">
								Rp {data.earnings.totalItemReimbursements.toLocaleString('id-ID')}
							</p>
							<span class="text-[11px] text-muted-foreground">Sesuai struk kasir toko</span>
						</div>

						<div class="rounded-2xl border border-border/80 bg-card p-4">
							<span class="block text-xs text-muted-foreground">Pencairan Tercatat (Payout)</span>
							<p class="mt-1 text-xl font-bold text-foreground tabular-nums">
								Rp {data.earnings.recordedPayoutTotal.toLocaleString('id-ID')}
							</p>
							<span class="text-[11px] text-muted-foreground tabular-nums">
								{#if data.earnings.hasRecordedPayouts}
									Sisa tercatat: Rp {data.earnings.unpaidRecordedBalance.toLocaleString('id-ID')}
								{:else}
									Belum ada pencairan tercatat
								{/if}
							</span>
						</div>
					</div>

					{#if data.earnings.history.length === 0}
						<div
							class="rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 text-center text-xs text-muted-foreground"
						>
							Belum ada pesanan selesai untuk dihitung dalam riwayat pendapatan.
						</div>
					{:else}
						<div class="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card">
							{#each data.earnings.history as h (h.orderId)}
								<div class="flex flex-wrap items-center justify-between gap-2 p-4 text-xs">
									<div class="min-w-0">
										<a
											href={resolve('/pesanan/[id]', { id: h.orderNumber })}
											class="font-mono font-bold text-foreground hover:text-primary hover:underline"
										>
											{h.orderNumber}
										</a>
										<span class="ml-1.5 text-muted-foreground">&bull; {h.originName}</span>
									</div>
									<div class="flex items-center gap-3 tabular-nums">
										<span class="text-muted-foreground">
											Belanja Rp {h.itemReimbursement.toLocaleString('id-ID')}
										</span>
										<span class="font-bold text-primary">
											Jasa +Rp {h.netProviderEarning.toLocaleString('id-ID')}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- TAB: PROFIL USAHA -->
			{:else if activeTab === 'profile'}
				<section class="space-y-5">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 class="text-base font-bold text-foreground">Profil Usaha &amp; Wilayah</h2>
							<p class="text-xs text-muted-foreground">
								Informasi usaha dan cakupan rute yang tampil ke pelanggan.
							</p>
						</div>

						<div
							class="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs"
						>
							<Star class="size-4 fill-amber-400 text-amber-400" />
							<span class="font-bold text-foreground tabular-nums">
								{Number(data.providerProfile?.rating_avg || 5.0).toFixed(1)}
							</span>
							<span class="text-muted-foreground tabular-nums">
								({data.ratingSummary.ratingCount} ulasan)
							</span>
						</div>
					</div>

					<div class="rounded-2xl border border-border/80 bg-card p-5">
						<div class="flex items-center justify-between border-b border-border/60 pb-3">
							<span class="text-xs font-bold text-foreground">Detail Usaha</span>
							<button
								type="button"
								class="text-xs font-semibold text-primary hover:underline"
								onclick={() => (isEditingProfile = !isEditingProfile)}
							>
								{isEditingProfile ? 'Batal' : 'Edit Profil Usaha'}
							</button>
						</div>

						{#if isEditingProfile}
							<form method="POST" action="?/updateProfile" class="mt-4 space-y-4" use:enhance>
								<div class="space-y-1.5">
									<Label for="business_name" class="text-xs font-semibold">
										Nama Usaha / Mitra
									</Label>
									<Input
										id="business_name"
										name="business_name"
										value={data.providerProfile?.business_name || ''}
										required
										class="h-10 text-base sm:h-9 sm:text-xs"
									/>
								</div>

								<div class="space-y-1.5">
									<Label for="coverage_area" class="text-xs font-semibold">
										Cakupan Area Layanan
									</Label>
									<Input
										id="coverage_area"
										name="coverage_area"
										value={data.providerProfile?.coverage_area || 'Gatak, Gawok, Trangsan, Mayang'}
										required
										class="h-10 text-base sm:h-9 sm:text-xs"
									/>
								</div>

								<div class="space-y-1.5">
									<Label for="bio" class="text-xs font-semibold">
										Bio &amp; Pengalaman Belanja
									</Label>
									<Textarea
										id="bio"
										name="bio"
										value={data.providerProfile?.bio || ''}
										rows={3}
										placeholder="Ceritakan rute belanja harian atau area layanan Anda..."
										class="text-base sm:text-xs"
									/>
								</div>

								<div class="flex justify-end gap-2 pt-2">
									<Button
										variant="outline"
										size="sm"
										type="button"
										class="h-9 text-xs"
										onclick={() => (isEditingProfile = false)}
									>
										Batal
									</Button>
									<Button size="sm" type="submit" class="h-9 text-xs font-bold">
										Simpan Perubahan
									</Button>
								</div>
							</form>
						{:else}
							<dl class="mt-4 space-y-4 text-xs">
								<div>
									<dt class="text-[11px] font-medium text-muted-foreground">Nama Usaha</dt>
									<dd class="mt-0.5 text-sm font-bold text-foreground">
										{data.providerProfile?.business_name || 'Mitra Jastip Gatak'}
									</dd>
								</div>
								<div>
									<dt class="text-[11px] font-medium text-muted-foreground">
										Cakupan Area Operasional
									</dt>
									<dd class="mt-0.5 font-medium text-foreground">
										{data.providerProfile?.coverage_area || 'Gatak, Gawok, Trangsan, Mayang'}
									</dd>
								</div>
								<div>
									<dt class="text-[11px] font-medium text-muted-foreground">Bio / Catatan</dt>
									<dd class="mt-0.5 leading-relaxed text-muted-foreground">
										{data.providerProfile?.bio ||
											'Siap melayani jastip belanja kebutuhan warga lokal.'}
									</dd>
								</div>
							</dl>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<!-- Accessible Dialog: Tambah / Edit Layanan Jastip -->
<Dialog.Root bind:open={isServiceModalOpen}>
	<Dialog.Content class="max-w-lg rounded-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-base font-bold">
				{editingService ? 'Ubah Penawaran Jastip' : 'Tambah Layanan Jastip Baru'}
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				Layanan ini akan tampil di katalog pencarian pelanggan Titipin.
			</Dialog.Description>
		</Dialog.Header>

		{#if serviceModalError}
			<div
				role="alert"
				class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
			>
				<AlertCircle class="mt-0.5 size-4 shrink-0" />
				<span>{serviceModalError}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/saveService"
			class="space-y-3.5"
			use:enhance={() => {
				savingService = true;
				serviceModalError = '';
				return async ({ result, update }) => {
					savingService = false;
					if (result.type === 'failure') {
						const resData = result.data as { serviceError?: string } | undefined;
						serviceModalError = resData?.serviceError || 'Gagal menyimpan layanan.';
					} else if (result.type === 'success') {
						isServiceModalOpen = false;
						await update();
					} else {
						await update();
					}
				};
			}}
		>
			<input type="hidden" name="id" value={serviceId} />

			<div class="space-y-1">
				<Label for="category_id" class="text-xs font-semibold">Kategori Layanan</Label>
				<Select
					id="category_id"
					name="category_id"
					bind:value={categoryId}
					options={data.categories.map((cat) => ({ value: cat.id, label: cat.name }))}
				/>
			</div>

			<div class="space-y-1">
				<Label for="title" class="text-xs font-semibold">Judul Layanan</Label>
				<Input
					id="title"
					name="title"
					bind:value={serviceTitle}
					placeholder="Contoh: Jastip Soto Bebek Gawok / Belanja Pasar Pagi"
					required
					class="h-10 text-base sm:h-9 sm:text-xs"
				/>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1">
					<Label for="base_fee" class="text-xs font-semibold">Tarif Dasar Jastip (Rp)</Label>
					<Input
						id="base_fee"
						name="base_fee"
						type="number"
						bind:value={serviceBaseFee}
						min={1000}
						step={500}
						required
						class="h-10 text-base font-bold text-primary tabular-nums sm:h-9 sm:text-xs"
					/>
				</div>

				<div class="space-y-1">
					<Label for="coverage_area" class="text-xs font-semibold">Cakupan Area Titipan</Label>
					<Input
						id="coverage_area"
						name="coverage_area"
						bind:value={serviceCoverage}
						placeholder="Gatak, Gawok, Mayang"
						required
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<Label for="description" class="text-xs font-semibold">Deskripsi / Ketentuan Khusus</Label>
				<Textarea
					id="description"
					name="description"
					bind:value={serviceDescription}
					placeholder="Misal: Siap belanja jam 06.00 - 10.00 pagi. Nota belanja difoto langsung."
					rows={2}
					class="text-base sm:text-xs"
				/>
			</div>

			<div class="flex items-center gap-2 pt-1">
				<input
					type="checkbox"
					id="is_active"
					name="is_active"
					value="true"
					bind:checked={serviceIsActive}
					class="size-4 rounded border-border text-primary focus:ring-primary"
				/>
				<Label for="is_active" class="cursor-pointer text-xs font-medium text-foreground">
					Aktifkan penawaran ini di katalog pencarian
				</Label>
			</div>

			<Dialog.Footer class="gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					type="button"
					onclick={() => (isServiceModalOpen = false)}
					class="h-9 text-xs"
					disabled={savingService}
				>
					Batal
				</Button>
				<Button size="sm" type="submit" class="h-9 text-xs font-bold" disabled={savingService}>
					{savingService ? 'Menyimpan...' : editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
