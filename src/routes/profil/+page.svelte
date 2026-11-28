<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { ORDER_STATUS_LABELS, formatCleanAddress } from '#lib/constants/order.js';
	import { formatUserUid } from '#lib/utils/uid.js';
	import {
		AlertCircle,
		ArrowRight,
		Bell,
		Check,
		CheckCircle2,
		ChevronRight,
		Clock,
		Compass,
		Copy,
		Edit3,
		LayoutDashboard,
		LogOut,
		Mail,
		MapPin,
		Phone,
		Plus,
		ShieldCheck,
		ShoppingBag,
		Star,
		Trash2,
		User
	} from 'lucide-svelte';
	import type { Address } from '#lib/types/database.types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type ProfileTab = 'overview' | 'orders' | 'addresses' | 'account';
	type OrderFilter = 'all' | 'active' | 'completed';

	let activeTab = $state<ProfileTab>('overview');
	let orderFilter = $state<OrderFilter>('all');

	let isEditingProfile = $state(false);
	let savingProfile = $state(false);
	let isAddressModalOpen = $state(false);
	let editingAddress = $state<Address | null>(null);
	let savingAddress = $state(false);
	let modalError = $state('');
	let confirmDeleteAddressId = $state<string | null>(null);
	let copiedUid = $state(false);

	// Address modal fields
	let addressId = $state('');
	let addressLabel = $state('');
	let recipientName = $state('');
	let recipientPhone = $state('');
	let streetAddress = $state('');
	let notes = $state('');
	let city = $state('Gatak, Sukoharjo');
	let postalCode = $state('');
	let isPrimary = $state(false);

	const userUid = $derived(formatUserUid(data.user?.id));

	const roleLabel = $derived.by(() => {
		if (data.role === 'admin') return 'Pemilik / Admin';
		if (data.role === 'provider') return 'Mitra Jastip';
		return 'Pelanggan';
	});

	const primaryAddress = $derived(
		data.addresses.find((a) => a.is_primary) || data.addresses[0] || null
	);

	const activeOrders = $derived(
		data.orders.filter((o) =>
			['pending', 'accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
		)
	);

	const recentOrders = $derived(data.orders.slice(0, 4));

	const filteredOrders = $derived.by(() => {
		if (orderFilter === 'active') {
			return activeOrders;
		}
		if (orderFilter === 'completed') {
			return data.orders.filter((o) => ['completed', 'cancelled', 'rejected'].includes(o.status));
		}
		return data.orders;
	});

	const orderFilters: { id: OrderFilter; label: string }[] = [
		{ id: 'all', label: 'Semua' },
		{ id: 'active', label: 'Berjalan' },
		{ id: 'completed', label: 'Selesai' }
	];

	const navItems = $derived([
		{ id: 'overview' as ProfileTab, label: 'Ringkasan', icon: LayoutDashboard, badge: 0 },
		{
			id: 'orders' as ProfileTab,
			label: 'Riwayat Pesanan',
			icon: ShoppingBag,
			badge: data.stats.activeOrdersCount
		},
		{
			id: 'addresses' as ProfileTab,
			label: 'Buku Alamat',
			icon: MapPin,
			badge: data.addresses.length
		},
		{ id: 'account' as ProfileTab, label: 'Pengaturan Akun', icon: User, badge: 0 }
	]);

	async function copyUid() {
		try {
			await navigator.clipboard.writeText(userUid);
			copiedUid = true;
			setTimeout(() => {
				copiedUid = false;
			}, 2000);
		} catch {
			copiedUid = false;
		}
	}

	function openAddAddressModal() {
		editingAddress = null;
		modalError = '';
		addressId = '';
		addressLabel = '';
		recipientName = data.profile?.full_name || '';
		recipientPhone = data.profile?.phone || '';
		streetAddress = '';
		notes = '';
		city = 'Gatak, Sukoharjo';
		postalCode = '';
		isPrimary = data.addresses.length === 0;
		isAddressModalOpen = true;
	}

	function openEditAddressModal(addr: Address) {
		editingAddress = addr;
		modalError = '';
		addressId = addr.id;
		addressLabel = addr.label;
		recipientName = addr.recipient_name;
		recipientPhone = addr.recipient_phone;
		streetAddress = addr.street_address;
		notes = addr.notes || '';
		city = addr.city;
		postalCode = addr.postal_code || '';
		isPrimary = addr.is_primary;
		isAddressModalOpen = true;
	}
</script>

<svelte:head>
	<title>Dasbor Akun - Titipin</title>
	<meta
		name="description"
		content="Dasbor akun Titipin: pantau riwayat pesanan, kelola buku alamat, dan atur profil Anda."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
	<!-- Compact Identity Header -->
	<header
		class="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex min-w-0 items-center gap-3.5">
			<div
				class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary"
			>
				{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
			</div>
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
						{data.profile?.full_name || 'Pengguna Titipin'}
					</h1>
					<span
						class="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
					>
						{roleLabel}
					</span>
				</div>
				<div
					class="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground"
				>
					<span class="truncate">{data.user?.email}</span>
					<span>&middot;</span>
					<button
						type="button"
						onclick={copyUid}
						class="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground hover:text-primary"
						title="Salin UID Pengguna"
					>
						<span>UID {userUid}</span>
						{#if copiedUid}
							<Check class="size-3 text-emerald-600" />
						{:else}
							<Copy class="size-3 text-muted-foreground" />
						{/if}
					</button>
				</div>
			</div>
		</div>

		<div class="flex shrink-0 flex-wrap items-center gap-2">
			<Button size="sm" href={resolve('/pesan')} class="h-9 gap-1.5 text-xs font-semibold">
				<Plus class="size-3.5" />
				<span>Buat Pesanan</span>
			</Button>

			<form method="POST" action={resolve('/keluar')}>
				<Button
					variant="outline"
					size="sm"
					type="submit"
					class="h-9 gap-1.5 text-xs font-semibold text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
				>
					<LogOut class="size-3.5" />
					<span>Keluar</span>
				</Button>
			</form>
		</div>
	</header>

	<!-- Feedback Banners -->
	{#if form?.profileSuccess || form?.addressSuccess}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.profileSuccess || form.addressSuccess}</span>
		</div>
	{/if}

	{#if form?.profileError || form?.addressError}
		<div
			class="mt-4 flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.profileError || form.addressError}</span>
		</div>
	{/if}

	<!-- Main Dashboard Layout -->
	<div class="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
		<!-- Mobile 2-Column Nav -->
		<nav class="grid grid-cols-2 gap-1.5 lg:hidden" aria-label="Menu Dasbor Akun">
			{#each navItems as item (item.id)}
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
		</nav>

		<!-- Desktop Sticky Sidebar -->
		<aside class="hidden w-60 shrink-0 lg:block">
			<div class="sticky top-20 space-y-5">
				<nav class="space-y-0.5" aria-label="Menu Dasbor Akun">
					{#each navItems as item (item.id)}
						{@const Icon = item.icon}
						{@const isActive = activeTab === item.id}
						<button
							type="button"
							onclick={() => (activeTab = item.id)}
							class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 {isActive
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
				</nav>

				<!-- Connected App Shortcuts -->
				<div class="space-y-1.5 border-t border-border/60 pt-4">
					<p class="px-3 text-[11px] font-semibold text-muted-foreground">Akses Cepat</p>
					<a
						href={resolve('/layanan')}
						class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
					>
						<span class="flex items-center gap-2.5">
							<Compass class="size-4 shrink-0" />
							<span>Cari Layanan</span>
						</span>
						<ChevronRight class="size-3.5" />
					</a>
					<a
						href={resolve('/notifikasi')}
						class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
					>
						<span class="flex items-center gap-2.5">
							<Bell class="size-4 shrink-0" />
							<span>Notifikasi</span>
						</span>
						{#if data.stats.unreadNotificationsCount > 0}
							<span
								class="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums"
							>
								{data.stats.unreadNotificationsCount}
							</span>
						{:else}
							<ChevronRight class="size-3.5" />
						{/if}
					</a>

					{#if data.role === 'provider' || data.role === 'admin'}
						<a
							href={resolve('/mitra/dashboard')}
							class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
						>
							<span class="flex items-center gap-2.5">
								<LayoutDashboard class="size-4 shrink-0 text-primary" />
								<span>Dashboard Mitra</span>
							</span>
							<ChevronRight class="size-3.5" />
						</a>
					{/if}

					{#if data.role === 'admin'}
						<a
							href={resolve('/admin')}
							class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
						>
							<span class="flex items-center gap-2.5">
								<ShieldCheck class="size-4 shrink-0 text-primary" />
								<span>Admin Console</span>
							</span>
							<ChevronRight class="size-3.5" />
						</a>
					{/if}
				</div>
			</div>
		</aside>

		<!-- Main Workspace -->
		<div class="min-w-0 flex-1">
			<!-- TAB: RINGKASAN (USER DASHBOARD) -->
			{#if activeTab === 'overview'}
				<div class="space-y-6">
					<!-- Role Workspaces Banner (if admin or provider) -->
					{#if data.role === 'admin' || data.role === 'provider'}
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
							{#if data.role === 'admin'}
								<a
									href={resolve('/admin')}
									class="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 transition-colors hover:border-primary/40"
								>
									<div class="flex items-center gap-2.5">
										<ShieldCheck class="size-4 text-primary" />
										<span class="text-xs font-bold text-foreground">Admin Console</span>
									</div>
									<ArrowRight class="size-4 text-primary" />
								</a>
							{/if}
							<a
								href={resolve('/mitra/dashboard')}
								class="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 transition-colors hover:border-primary/40"
							>
								<div class="flex items-center gap-2.5">
									<LayoutDashboard class="size-4 text-primary" />
									<span class="text-xs font-bold text-foreground">Dashboard Mitra</span>
								</div>
								<ArrowRight class="size-4 text-primary" />
							</a>
						</div>
					{/if}

					<!-- Recent / Active Orders -->
					<section class="rounded-2xl border border-border/80 bg-card p-5">
						<div
							class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5"
						>
							<div>
								<h2 class="text-sm font-bold text-foreground">
									{activeOrders.length > 0 ? 'Pesanan Sedang Berjalan' : 'Pesanan Terakhir'}
								</h2>
								<p class="text-xs text-muted-foreground tabular-nums">
									{data.stats.totalOrders} total pesanan &middot; {data.stats.completedOrdersCount}
									selesai
								</p>
							</div>
							<div class="flex items-center gap-3">
								{#if data.orders.length > 0}
									<button
										type="button"
										onclick={() => (activeTab = 'orders')}
										class="text-xs font-semibold text-primary hover:underline"
									>
										Lihat Semua
									</button>
								{/if}
								<a
									href={resolve('/pesanan')}
									class="text-xs font-medium text-muted-foreground hover:text-foreground"
								>
									Halaman Pesanan &rarr;
								</a>
							</div>
						</div>

						{#if recentOrders.length === 0}
							<div class="flex flex-col items-center justify-center py-10 text-center">
								<ShoppingBag class="size-7 text-muted-foreground/60" />
								<p class="mt-3 text-sm font-bold text-foreground">Belum ada pesanan</p>
								<p class="mt-1 max-w-sm text-xs text-muted-foreground">
									Mulai titip belanja dari warung, pasar, atau apotek di sekitar Gatak dan
									Kartasura.
								</p>
								<div class="mt-4 flex flex-wrap justify-center gap-2">
									<Button size="sm" href={resolve('/pesan')} class="h-9 text-xs font-semibold">
										Buat Pesanan Sekarang
									</Button>
									<Button
										size="sm"
										variant="outline"
										href={resolve('/layanan')}
										class="h-9 text-xs"
									>
										Lihat Layanan
									</Button>
								</div>
							</div>
						{:else}
							<div class="mt-3 divide-y divide-border/50">
								{#each recentOrders as order (order.id)}
									{@const statusMeta = ORDER_STATUS_LABELS[order.status] || {
										label: order.status,
										badgeClass: 'bg-muted text-muted-foreground'
									}}
									<a
										href={resolve('/pesanan/[id]', { id: order.order_number })}
										class="flex flex-col justify-between gap-2.5 py-3.5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
									>
										<div class="min-w-0 space-y-1">
											<div class="flex flex-wrap items-center gap-2">
												<span class="font-mono text-xs font-bold text-foreground tabular-nums">
													{order.order_number}
												</span>
												<span
													class="rounded-full border px-2 py-0.5 text-[10px] font-semibold {statusMeta.badgeClass}"
												>
													{statusMeta.label}
												</span>
											</div>
											<p class="truncate text-sm font-semibold text-foreground">
												{order.origin_name}
											</p>
											<p class="text-xs text-muted-foreground tabular-nums">
												{order.items.length} item &middot;
												{new Date(order.created_at).toLocaleDateString('id-ID', {
													day: 'numeric',
													month: 'short',
													hour: '2-digit',
													minute: '2-digit'
												})}
											</p>
										</div>

										<div class="flex items-center justify-between gap-3 sm:justify-end">
											<div class="text-left sm:text-right">
												<span class="block text-[11px] text-muted-foreground">
													{order.actual_total ? 'Total Nota' : 'Estimasi'}
												</span>
												<span class="text-sm font-bold text-primary tabular-nums">
													Rp {Number(order.actual_total || order.total_estimated).toLocaleString(
														'id-ID'
													)}
												</span>
											</div>
											<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</section>

					<!-- Connected Bottom Grid: Primary Address + Recent Notifications -->
					<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
						<!-- Primary Address Summary -->
						<section
							class="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5"
						>
							<div class="space-y-3">
								<div class="flex items-center justify-between border-b border-border/60 pb-3">
									<h2 class="text-sm font-bold text-foreground">Alamat Utama</h2>
									<button
										type="button"
										onclick={() => (activeTab = 'addresses')}
										class="text-xs font-semibold text-primary hover:underline"
									>
										Kelola ({data.addresses.length})
									</button>
								</div>

								{#if primaryAddress}
									<div class="space-y-1.5 text-xs">
										<div class="flex items-center gap-2">
											<span class="font-bold text-foreground">{primaryAddress.label}</span>
											{#if primaryAddress.is_primary}
												<span
													class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
												>
													Utama
												</span>
											{/if}
										</div>
										<p class="font-medium text-foreground">
											{primaryAddress.recipient_name} &middot;
											<span class="tabular-nums">{primaryAddress.recipient_phone}</span>
										</p>
										<p class="leading-relaxed text-muted-foreground">
											{primaryAddress.street_address}, {primaryAddress.city}
										</p>
									</div>
								{:else}
									<p class="text-xs leading-relaxed text-muted-foreground">
										Belum ada alamat tersimpan. Tambahkan alamat rumah atau kost untuk mempercepat
										pemesanan.
									</p>
								{/if}
							</div>

							<div class="mt-4 pt-2">
								<Button
									variant="outline"
									size="sm"
									onclick={openAddAddressModal}
									class="h-8 gap-1.5 text-xs"
								>
									<Plus class="size-3.5" />
									<span>Tambah Alamat Baru</span>
								</Button>
							</div>
						</section>

						<!-- Recent Notifications -->
						<section
							class="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5"
						>
							<div class="space-y-3">
								<div class="flex items-center justify-between border-b border-border/60 pb-3">
									<h2 class="text-sm font-bold text-foreground">Notifikasi Terbaru</h2>
									<a
										href={resolve('/notifikasi')}
										class="text-xs font-semibold text-primary hover:underline"
									>
										Lihat Semua
									</a>
								</div>

								{#if data.recentNotifications.length === 0}
									<p class="text-xs text-muted-foreground">
										Belum ada pembaruan pesanan atau notifikasi baru.
									</p>
								{:else}
									<ul class="divide-y divide-border/50 text-xs">
										{#each data.recentNotifications as notif (notif.id)}
											<li class="py-2.5 first:pt-0 last:pb-0">
												<div class="flex items-start justify-between gap-2">
													<p
														class="font-semibold {notif.is_read
															? 'text-foreground'
															: 'text-primary'}"
													>
														{notif.title}
													</p>
													{#if !notif.is_read}
														<span class="mt-1 size-2 shrink-0 rounded-full bg-primary"></span>
													{/if}
												</div>
												<p class="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
													{notif.body}
												</p>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</section>
					</div>
				</div>

				<!-- TAB: RIWAYAT PESANAN -->
			{:else if activeTab === 'orders'}
				<section class="space-y-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 class="text-base font-bold text-foreground">Riwayat Pesanan</h2>
							<p class="text-xs text-muted-foreground">
								Semua pesanan titip belanja Anda beserta status dan rincian nota.
							</p>
						</div>

						<div class="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 p-1">
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
								Belum ada pesanan pada kategori ini
							</p>
							<Button size="sm" href={resolve('/pesan')} class="mt-4 h-9 text-xs font-semibold">
								Buat Pesanan Baru
							</Button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each filteredOrders as order (order.id)}
								{@const statusMeta = ORDER_STATUS_LABELS[order.status] || {
									label: order.status,
									badgeClass: 'bg-muted text-muted-foreground'
								}}
								<a
									href={resolve('/pesanan/[id]', { id: order.order_number })}
									class="group flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 transition-colors duration-150 hover:border-primary/40 sm:flex-row sm:items-center sm:p-5"
								>
									<div class="min-w-0 space-y-1.5">
										<div class="flex flex-wrap items-center gap-2">
											<span class="font-mono text-xs font-bold text-foreground tabular-nums">
												{order.order_number}
											</span>
											<span
												class="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold {statusMeta.badgeClass}"
											>
												{statusMeta.label}
											</span>
											<span
												class="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
											>
												<Clock class="size-3" />
												{new Date(order.created_at).toLocaleDateString('id-ID', {
													day: 'numeric',
													month: 'short',
													year: 'numeric'
												})}
											</span>
										</div>

										<p class="text-sm font-bold text-foreground group-hover:text-primary">
											{order.origin_name}
										</p>
										<p class="truncate text-xs text-muted-foreground">
											{formatCleanAddress(order.destination_address_text)} &middot;
											{order.items.length} item
										</p>
									</div>

									<div
										class="flex items-center justify-between gap-3 border-t border-border/50 pt-3 sm:border-0 sm:pt-0"
									>
										<div class="text-left sm:text-right">
											<span class="block text-[11px] text-muted-foreground">
												{order.actual_total ? 'Total Nota Akhir' : 'Total Estimasi'}
											</span>
											<span class="text-sm font-bold text-primary tabular-nums">
												Rp {Number(order.actual_total || order.total_estimated).toLocaleString(
													'id-ID'
												)}
											</span>
										</div>
										<ChevronRight
											class="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
										/>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</section>

				<!-- TAB: BUKU ALAMAT -->
			{:else if activeTab === 'addresses'}
				<section class="space-y-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 class="text-base font-bold text-foreground">Buku Alamat Pengantaran</h2>
							<p class="text-xs text-muted-foreground">
								{data.addresses.length} alamat tersimpan untuk tujuan pengantaran pesanan.
							</p>
						</div>

						<Button
							size="sm"
							class="h-9 gap-1.5 text-xs font-semibold"
							onclick={openAddAddressModal}
						>
							<Plus class="size-3.5" />
							<span>Tambah Alamat</span>
						</Button>
					</div>

					{#if data.addresses.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-12 text-center"
						>
							<MapPin class="size-7 text-muted-foreground/60" />
							<h3 class="mt-3 text-sm font-bold text-foreground">Belum ada alamat tersimpan</h3>
							<p class="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
								Simpan alamat rumah, kost, atau kantor di area Gatak dan sekitarnya agar pengisian
								pesanan lebih cepat.
							</p>
							<Button
								size="sm"
								class="mt-4 h-9 gap-1.5 text-xs font-semibold"
								onclick={openAddAddressModal}
							>
								<Plus class="size-3.5" />
								<span>Tambah Alamat Pertama</span>
							</Button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each data.addresses as addr (addr.id)}
								<article
									class="flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors duration-150 sm:flex-row sm:items-start {addr.is_primary
										? 'border-primary/50 bg-primary/5'
										: 'border-border/80 bg-card'}"
								>
									<div class="min-w-0 space-y-1.5">
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-xs font-bold text-foreground">{addr.label}</span>
											{#if addr.is_primary}
												<span
													class="inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
												>
													<Star class="size-2.5 fill-current" />
													<span>Utama</span>
												</span>
											{/if}
										</div>

										<p class="text-xs font-medium text-foreground">
											<span class="font-semibold">{addr.recipient_name}</span> &middot;
											<span class="tabular-nums">{addr.recipient_phone}</span>
										</p>

										<p class="text-xs leading-relaxed text-muted-foreground">
											{addr.street_address}, {addr.city}
											{addr.postal_code ? `(${addr.postal_code})` : ''}
										</p>

										{#if addr.notes}
											<p
												class="rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground"
											>
												<span class="font-semibold text-foreground">Patokan:</span>
												{addr.notes}
											</p>
										{/if}
									</div>

									<div class="flex shrink-0 flex-wrap items-center gap-1.5">
										{#if !addr.is_primary}
											<form method="POST" action="?/setPrimaryAddress" use:enhance>
												<input type="hidden" name="id" value={addr.id} />
												<button
													type="submit"
													class="inline-flex h-8 items-center rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
												>
													Jadikan Utama
												</button>
											</form>
										{/if}

										<button
											type="button"
											class="inline-flex h-8 items-center rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
											onclick={() => openEditAddressModal(addr)}
										>
											<Edit3 class="mr-1 size-3" />
											<span>Edit</span>
										</button>

										{#if confirmDeleteAddressId === addr.id}
											<div class="flex items-center gap-1">
												<form method="POST" action="?/deleteAddress" use:enhance>
													<input type="hidden" name="id" value={addr.id} />
													<button
														type="submit"
														class="inline-flex h-8 items-center rounded-lg bg-destructive px-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
													>
														Hapus
													</button>
												</form>
												<button
													type="button"
													onclick={() => (confirmDeleteAddressId = null)}
													class="inline-flex h-8 items-center rounded-lg border border-border/70 px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
												>
													Batal
												</button>
											</div>
										{:else}
											<button
												type="button"
												onclick={() => (confirmDeleteAddressId = addr.id)}
												class="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
												aria-label="Hapus alamat {addr.label}"
												title="Hapus Alamat"
											>
												<Trash2 class="size-3.5" />
											</button>
										{/if}
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</section>

				<!-- TAB: PENGATURAN AKUN -->
			{:else if activeTab === 'account'}
				<section class="space-y-5">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-base font-bold text-foreground">Pengaturan Akun</h2>
							<p class="text-xs text-muted-foreground">
								Perbarui nama lengkap, nomor WhatsApp, dan lihat UID akun Anda.
							</p>
						</div>

						<button
							type="button"
							class="text-xs font-semibold text-primary hover:underline"
							onclick={() => (isEditingProfile = !isEditingProfile)}
						>
							{isEditingProfile ? 'Batal' : 'Ubah Data'}
						</button>
					</div>

					<div class="rounded-2xl border border-border/80 bg-card p-5">
						{#if isEditingProfile}
							<form
								method="POST"
								action="?/updateProfile"
								class="space-y-4"
								use:enhance={() => {
									savingProfile = true;
									return async ({ result, update }) => {
										savingProfile = false;
										if (result.type === 'success') {
											isEditingProfile = false;
										}
										await update();
									};
								}}
							>
								<div class="space-y-1.5">
									<Label for="full_name" class="text-xs font-semibold text-foreground">
										Nama Lengkap
									</Label>
									<Input
										id="full_name"
										name="full_name"
										value={data.profile?.full_name || ''}
										placeholder="Nama lengkap Anda"
										required
										class="h-10 text-base sm:h-9 sm:text-xs"
									/>
								</div>

								<div class="space-y-1.5">
									<Label for="phone" class="text-xs font-semibold text-foreground">
										Nomor WhatsApp
									</Label>
									<Input
										id="phone"
										name="phone"
										type="tel"
										value={data.profile?.phone || ''}
										placeholder="08123456789"
										class="h-10 text-base sm:h-9 sm:text-xs"
									/>
								</div>

								<div class="flex items-center justify-end gap-2 pt-1">
									<Button
										variant="outline"
										size="sm"
										type="button"
										class="h-9 text-xs"
										onclick={() => (isEditingProfile = false)}
										disabled={savingProfile}
									>
										Batal
									</Button>
									<Button
										size="sm"
										type="submit"
										class="h-9 text-xs font-semibold"
										disabled={savingProfile}
									>
										{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
									</Button>
								</div>
							</form>
						{:else}
							<dl class="divide-y divide-border/50 text-xs">
								<div class="flex items-center gap-3 pb-3.5">
									<User class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0 flex-1">
										<dt class="text-[11px] text-muted-foreground">Nama Lengkap</dt>
										<dd class="font-semibold text-foreground">
											{data.profile?.full_name || 'Pengguna'}
										</dd>
									</div>
								</div>

								<div class="flex items-center gap-3 py-3.5">
									<Mail class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0 flex-1">
										<dt class="text-[11px] text-muted-foreground">Email Terdaftar</dt>
										<dd class="truncate font-medium text-foreground">{data.user?.email}</dd>
									</div>
								</div>

								<div class="flex items-center gap-3 py-3.5">
									<Phone class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0 flex-1">
										<dt class="text-[11px] text-muted-foreground">Nomor WhatsApp</dt>
										<dd class="font-medium text-foreground tabular-nums">
											{data.profile?.phone || 'Belum ditambahkan'}
										</dd>
									</div>
								</div>

								<div class="flex items-center justify-between gap-3 pt-3.5">
									<div class="flex min-w-0 items-center gap-3">
										<ShieldCheck class="size-4 shrink-0 text-muted-foreground" />
										<div class="min-w-0">
											<dt class="text-[11px] text-muted-foreground">UID Pengguna</dt>
											<dd class="font-mono text-xs font-bold text-foreground tabular-nums">
												{userUid}
											</dd>
										</div>
									</div>

									<button
										type="button"
										onclick={copyUid}
										class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										aria-label="Salin UID Pengguna"
									>
										{#if copiedUid}
											<Check class="size-3.5 text-emerald-600" />
											<span class="text-emerald-600">Tersalin</span>
										{:else}
											<Copy class="size-3.5" />
											<span>Salin UID</span>
										{/if}
									</button>
								</div>
							</dl>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<!-- Accessible Dialog: Add / Edit Address -->
<Dialog.Root bind:open={isAddressModalOpen}>
	<Dialog.Content class="max-w-lg rounded-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-base font-bold">
				{editingAddress ? 'Ubah Alamat Pengantaran' : 'Tambah Alamat Baru'}
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				Pastikan nomor kontak dan rincian jalan jelas agar kurir dapat mengantar tepat waktu.
			</Dialog.Description>
		</Dialog.Header>

		{#if modalError}
			<div
				role="alert"
				class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
			>
				<AlertCircle class="mt-0.5 size-4 shrink-0" />
				<span>{modalError}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/saveAddress"
			class="space-y-3.5"
			use:enhance={() => {
				savingAddress = true;
				modalError = '';
				return async ({ result, update }) => {
					savingAddress = false;
					if (result.type === 'failure') {
						const resData = result.data as { addressError?: string } | undefined;
						modalError = resData?.addressError || 'Gagal menyimpan alamat. Periksa data kembali.';
					} else if (result.type === 'success') {
						isAddressModalOpen = false;
						await update();
					} else {
						await update();
					}
				};
			}}
		>
			<input type="hidden" name="id" value={addressId} />

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1">
					<Label for="label" class="text-xs font-semibold">Label Alamat</Label>
					<Input
						id="label"
						name="label"
						bind:value={addressLabel}
						placeholder="Contoh: Rumah, Kost, Kantor"
						required
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>

				<div class="space-y-1">
					<Label for="city" class="text-xs font-semibold">Kota / Kecamatan</Label>
					<Input
						id="city"
						name="city"
						bind:value={city}
						required
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1">
					<Label for="recipient_name" class="text-xs font-semibold">Nama Penerima</Label>
					<Input
						id="recipient_name"
						name="recipient_name"
						bind:value={recipientName}
						required
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>

				<div class="space-y-1">
					<Label for="recipient_phone" class="text-xs font-semibold">No. WhatsApp Penerima</Label>
					<Input
						id="recipient_phone"
						name="recipient_phone"
						type="tel"
						bind:value={recipientPhone}
						placeholder="08123456789"
						required
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<Label for="street_address" class="text-xs font-semibold">
					Alamat Lengkap (Jalan, Dusun/RT/RW, No. Rumah)
				</Label>
				<Textarea
					id="street_address"
					name="street_address"
					bind:value={streetAddress}
					placeholder="Jl. Raya Gawok No. 12, RT 01/RW 03, Trangsan..."
					required
					rows={2}
					class="text-base sm:text-xs"
				/>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="space-y-1 sm:col-span-2">
					<Label for="notes" class="text-xs font-semibold">Catatan Patokan Lokasi</Label>
					<Input
						id="notes"
						name="notes"
						bind:value={notes}
						placeholder="Contoh: Depan gardu ronda, pagar hitam"
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>

				<div class="space-y-1">
					<Label for="postal_code" class="text-xs font-semibold">Kode Pos</Label>
					<Input
						id="postal_code"
						name="postal_code"
						bind:value={postalCode}
						placeholder="57557"
						class="h-10 text-base sm:h-9 sm:text-xs"
					/>
				</div>
			</div>

			<div class="flex items-center gap-2 pt-1">
				<input
					type="checkbox"
					id="is_primary"
					name="is_primary"
					value="true"
					bind:checked={isPrimary}
					class="size-4 rounded border-border text-primary focus:ring-primary"
				/>
				<Label for="is_primary" class="cursor-pointer text-xs font-medium text-foreground">
					Jadikan sebagai alamat utama
				</Label>
			</div>

			<Dialog.Footer class="gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					type="button"
					onclick={() => (isAddressModalOpen = false)}
					class="h-9 text-xs"
					disabled={savingAddress}
				>
					Batal
				</Button>
				<Button size="sm" type="submit" class="h-9 text-xs font-bold" disabled={savingAddress}>
					{savingAddress ? 'Menyimpan...' : editingAddress ? 'Simpan Perubahan' : 'Tambah Alamat'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
