<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { ServiceCategory } from '#lib/types/database.types.js';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import {
		Users,
		Store,
		Layers,
		Plus,
		CheckCircle2,
		AlertCircle,
		Pencil,
		Trash2,
		Power,
		Sliders,
		LayoutDashboard,
		ExternalLink,
		Settings,
		ToggleLeft,
		ToggleRight,
		ArrowRight,
		CircleCheck,
		Clock,
		ShieldCheck,
		Wallet,
		ShoppingBag
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Active tab state: 'overview' | 'orders' | 'payments' | 'categories' | 'users' | 'settings'
	let activeTab = $state<'overview' | 'orders' | 'payments' | 'categories' | 'users' | 'settings'>(
		'overview'
	);

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
</script>

<svelte:head>
	<title>Owner & Admin Console - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
	<!-- Top Bar / Header -->
	<div
		class="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
				>
					<ShieldCheck class="size-3.5" />
					<span>Owner & Admin Console</span>
				</span>

				{#if data.settings.allow_provider_registration}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600"
					>
						<CircleCheck class="size-3" />
						<span>Pendaftaran Mitra: Terbuka</span>
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600"
					>
						<Clock class="size-3" />
						<span>Pendaftaran Mitra: Ditutup (Internal)</span>
					</span>
				{/if}
			</div>

			<h1 class="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Pusat Kendali Operasional
			</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Masuk sebagai Pemilik Platform: <strong class="text-foreground">{data.user?.email}</strong>
				({data.profile?.full_name || 'Owner'})
			</p>
		</div>

		<div class="flex items-center gap-2 self-start sm:self-center">
			<Button variant="outline" size="sm" href={resolve('/profil')} class="h-9 text-xs">
				Profil Saya
			</Button>
			<Button
				variant="outline"
				size="sm"
				href={resolve('/')}
				target="_blank"
				class="h-9 gap-1.5 text-xs"
			>
				<span>Lihat Web Publik</span>
				<ExternalLink class="size-3.5" />
			</Button>
		</div>
	</div>

	<!-- Action Feedback Banner -->
	{#if form?.error}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}
	{#if form?.message}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs font-semibold text-primary"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Navigation Tabs Bar -->
	<div class="flex overflow-x-auto border-b border-border/60 pb-px text-xs font-medium">
		<button
			type="button"
			onclick={() => (activeTab = 'overview')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'overview'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<LayoutDashboard class="size-4" />
			<span>Ikhtisar Platform</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'orders')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'orders'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<ShoppingBag class="size-4" />
			<span>
				Pesanan Jastip
				{#if data.stats.pendingOrders > 0}
					({data.stats.pendingOrders} Baru)
				{:else if data.orders.length > 0}
					({data.orders.length})
				{/if}
			</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'payments')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'payments'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<Wallet class="size-4" />
			<span>
				Verifikasi Pembayaran
				{#if data.stats.awaitingPayments > 0}
					({data.stats.awaitingPayments} Menunggu)
				{/if}
			</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'categories')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'categories'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<Layers class="size-4" />
			<span>Kategori Layanan ({data.categories.length})</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'settings')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'settings'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<Sliders class="size-4" />
			<span>Pengaturan Platform</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'users')}
			class="inline-flex items-center gap-2 border-b-2 px-4 py-2.5 whitespace-nowrap transition-colors {activeTab ===
			'users'
				? 'border-primary font-bold text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
		>
			<Users class="size-4" />
			<span>Daftar Pengguna ({data.users.length})</span>
		</button>
	</div>

	<!-- TAB 1: OVERVIEW -->
	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<!-- Key Metrics Grid -->
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Card class="border-border/80">
					<CardHeader class="flex flex-row items-center justify-between pb-2">
						<CardTitle class="text-xs font-semibold text-muted-foreground">
							Total Pengguna
						</CardTitle>
						<Users class="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-black text-foreground">{data.stats.totalUsers}</div>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Akun terdaftar di database</p>
					</CardContent>
				</Card>

				<Card class="border-border/80">
					<CardHeader class="flex flex-row items-center justify-between pb-2">
						<CardTitle class="text-xs font-semibold text-muted-foreground">
							Mitra Terdaftar
						</CardTitle>
						<Store class="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-black text-foreground">{data.stats.totalProviders}</div>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Penyedia jasa terverifikasi</p>
					</CardContent>
				</Card>

				<Card class="border-border/80">
					<CardHeader class="flex flex-row items-center justify-between pb-2">
						<CardTitle class="text-xs font-semibold text-muted-foreground">
							Kategori Layanan
						</CardTitle>
						<Layers class="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-black text-foreground">
							{data.stats.activeCategories} / {data.stats.totalCategories}
						</div>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Kategori aktif publik</p>
					</CardContent>
				</Card>

				<Card class="border-border/80">
					<CardHeader class="flex flex-row items-center justify-between pb-2">
						<CardTitle class="text-xs font-semibold text-muted-foreground">
							Pendaftaran Mitra
						</CardTitle>
						<Settings class="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							class="text-sm font-bold {data.settings.allow_provider_registration
								? 'text-emerald-600'
								: 'text-amber-600'}"
						>
							{data.settings.allow_provider_registration ? 'Terbuka Umum' : 'Ditutup (Mandiri)'}
						</div>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Mode operasional saat ini</p>
					</CardContent>
				</Card>
			</div>

			<!-- Quick Control Box: Disable / Enable Mitra Registration -->
			<Card class="border-border/80 bg-muted/20">
				<CardHeader class="pb-3">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle class="text-base font-bold">Kontrol Cepat: Pendaftaran Mitra</CardTitle>
							<p class="text-xs text-muted-foreground">
								Karena layanan saat ini dikelola mandiri, kamu bisa membuka atau menutup pendaftaran
								mitra dengan satu klik.
							</p>
						</div>

						<form
							method="POST"
							action="?/toggleMitraRegistration"
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
								variant={data.settings.allow_provider_registration ? 'destructive' : 'default'}
								class="gap-1.5 text-xs font-bold"
							>
								{#if data.settings.allow_provider_registration}
									<ToggleLeft class="size-4" />
									<span>Tutup Pendaftaran Mitra</span>
								{:else}
									<ToggleRight class="size-4" />
									<span>Buka Pendaftaran Mitra</span>
								{/if}
							</Button>
						</form>
					</div>
				</CardHeader>
				<CardContent class="pt-0">
					<div class="rounded-xl border border-border/60 bg-card p-4 text-xs">
						{#if data.settings.allow_provider_registration}
							<div class="flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400">
								<CircleCheck class="mt-0.5 size-4 shrink-0" />
								<div>
									<span class="font-bold">Pendaftaran Mitra Terbuka untuk Umum.</span>
									<p class="mt-0.5 text-muted-foreground">
										Pengguna baru dapat memilih opsi peran <strong>Mitra Jastip</strong> di halaman pendaftaran
										(/daftar).
									</p>
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-2.5 text-amber-700 dark:text-amber-400">
								<Clock class="mt-0.5 size-4 shrink-0" />
								<div>
									<span class="font-bold">Pendaftaran Mitra Sedang Ditutup Sementara.</span>
									<p class="mt-0.5 text-muted-foreground">
										Di halaman pendaftaran, opsi Mitra dinonaktifkan secara otomatis dan diberi
										keterangan bahwa operasional dikelola mandiri oleh tim internal.
									</p>
								</div>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Development Phase Progress -->
			<Card class="border-border/80">
				<CardHeader class="pb-3">
					<CardTitle class="text-base font-bold">Status Roadmap & Pengembangan Titipin</CardTitle>
					<p class="text-xs text-muted-foreground">
						Gambaran progres arsitektur sistem berdasarkan Blueprint teknis.
					</p>
				</CardHeader>
				<CardContent class="space-y-3 pt-0">
					<div class="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
						<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
							<div class="flex items-center gap-1.5 font-bold text-emerald-600">
								<CircleCheck class="size-4" />
								<span>Phase 2: Auth & Role</span>
							</div>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Supabase Auth SSR, isolasi hak akses peran (Admin, Provider, Customer).
							</p>
						</div>

						<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
							<div class="flex items-center gap-1.5 font-bold text-emerald-600">
								<CircleCheck class="size-4" />
								<span>Phase 3: Profiles & Categories</span>
							</div>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Profil pengguna, alamat pengantaran, katalog kategori layanan, & panel admin.
							</p>
						</div>

						<div class="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
							<div class="flex items-center gap-1.5 font-bold text-primary">
								<ArrowRight class="size-4" />
								<span>Phase 4: Provider & Coverage</span>
							</div>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Listing penawaran layanan spesifik & radius jangkauan wilayah antar (Siap
								dikerjakan).
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- TAB 2: CATEGORIES -->
	{#if activeTab === 'categories'}
		<Card class="border-border/80">
			<CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle class="text-base font-bold">Katalog Kategori Layanan</CardTitle>
					<p class="text-xs text-muted-foreground">
						Daftar kategori belanja dan titipan yang tampil di beranda dan halaman eksplorasi.
					</p>
				</div>
				<Button
					size="sm"
					onclick={openAddCategoryModal}
					class="gap-1.5 self-start text-xs font-bold"
				>
					<Plus class="size-3.5" />
					<span>Tambah Kategori</span>
				</Button>
			</CardHeader>

			<CardContent>
				<div class="divide-y divide-border/60 rounded-xl border border-border/80">
					{#each data.categories as cat (cat.id)}
						<div
							class="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
						>
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-bold text-foreground">{cat.name}</span>
									{#if cat.is_active}
										<Badge variant="default" class="text-[10px]">Aktif</Badge>
									{:else}
										<Badge variant="secondary" class="text-[10px]">Non-Aktif</Badge>
									{/if}
									<span class="text-[11px] text-muted-foreground">Urutan: #{cat.sort_order}</span>
								</div>
								<p class="text-xs text-muted-foreground">
									{cat.description || 'Tidak ada deskripsi'}
								</p>
								<div class="flex items-center gap-3 text-[11px] text-muted-foreground">
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

							<div class="flex items-center gap-2 self-end sm:self-center">
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
										class="h-8 gap-1 px-2.5 text-xs"
									>
										<Power class="size-3.5" />
										<span>{cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
									</Button>
								</form>

								<Button
									variant="outline"
									size="sm"
									onclick={() => openEditCategoryModal(cat)}
									class="h-8 gap-1 px-2.5 text-xs"
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
										class="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
										aria-label="Hapus Kategori"
									>
										<Trash2 class="size-3.5" />
									</Button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- TAB 3: SETTINGS -->
	{#if activeTab === 'settings'}
		<Card class="border-border/80">
			<CardHeader>
				<CardTitle class="text-base font-bold">Konfigurasi Operasional Platform</CardTitle>
				<p class="text-xs text-muted-foreground">
					Kelola izin pendaftaran, status operasional, dan parameter sistem.
				</p>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/updateSettings"
					class="max-w-2xl space-y-5"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<div class="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
						<div class="flex items-center justify-between">
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
								class="size-5 rounded border-border text-primary focus:ring-primary"
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="platform_name" class="text-xs font-semibold">Nama Platform</Label>
						<Input
							id="platform_name"
							name="platform_name"
							value={data.settings.platform_name}
							class="text-xs"
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
							class="text-xs"
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="operational_status" class="text-xs font-semibold">Status Operasional</Label>
						<select
							id="operational_status"
							name="operational_status"
							value={data.settings.operational_status}
							class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
						>
							<option value="active">Berjalan Normal (Aktif)</option>
							<option value="maintenance">Mode Pemeliharaan (Maintenance)</option>
							<option value="paused">Operasional Dijeda Sementara</option>
						</select>
					</div>

					<div class="pt-2">
						<Button type="submit" size="sm" disabled={isSubmitting} class="font-bold">
							{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}

	<!-- TAB: ORDERS MANAGEMENT -->
	{#if activeTab === 'orders'}
		<Card class="border-border/80">
			<CardHeader>
				<CardTitle class="text-base font-bold">Pesanan Jastip Masuk & Berjalan</CardTitle>
				<p class="text-xs text-muted-foreground">
					Semua pesanan yang dikirim pelanggan tampil di sini agar dapat langsung diterima,
					dibelanjakan, dan diantar oleh Owner.
				</p>
			</CardHeader>
			<CardContent>
				{#if data.orders.length === 0}
					<div class="py-8 text-center text-xs text-muted-foreground">
						Belum ada pesanan jastip yang masuk.
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.orders as ord (ord.id)}
							{@const oMeta = ORDER_STATUS_LABELS[ord.status] || {
								label: ord.status,
								badgeClass: 'bg-muted text-muted-foreground'
							}}
							{@const pMeta = PAYMENT_STATUS_LABELS[ord.paymentStatus]}
							<div class="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
								<div
									class="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5"
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
									<span class="text-[10px] text-muted-foreground">
										{new Date(ord.created_at).toLocaleString('id-ID', {
											day: 'numeric',
											month: 'short',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>

								<div class="space-y-1">
									<p class="font-bold text-foreground">{ord.origin_name}</p>
									<p class="text-muted-foreground">{ord.destination_address_text}</p>
									<p class="text-[11px] text-muted-foreground">
										Pemesan:
										<strong class="text-foreground">
											{ord.recipient_name} ({ord.recipient_phone})
										</strong>
										&bull; Estimasi Total:
										<strong class="text-primary">
											Rp {Number(ord.actual_total || ord.total_estimated).toLocaleString('id-ID')}
										</strong>
									</p>
									<div class="rounded-lg bg-card p-2 text-[11px] text-foreground">
										<span class="font-semibold">Barang:</span>
										{ord.items.map((it) => `${it.name} (${it.quantity} ${it.unit})`).join(', ')}
									</div>
								</div>

								<div class="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2.5">
									{#if ord.status === 'pending'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={ord.id} />
											<input type="hidden" name="to_status" value="accepted" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Terima Pesanan
											</Button>
										</form>
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={ord.id} />
											<input type="hidden" name="to_status" value="rejected" />
											<Button
												size="sm"
												variant="outline"
												type="submit"
												class="h-8 text-xs text-destructive hover:bg-destructive/10"
											>
												Tolak
											</Button>
										</form>
									{:else if ord.status === 'accepted'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={ord.id} />
											<input type="hidden" name="to_status" value="shopping" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Mulai Belanja di Toko
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
											<input type="hidden" name="to_status" value="purchased" />
											<Input
												name="actual_item_cost"
												type="number"
												min="0"
												step="500"
												placeholder="Total nota fisik (Rp)"
												class="h-8 w-36 bg-background text-xs"
												required
											/>
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Selesai Belanja (Ada Struk)
											</Button>
										</form>
									{:else if ord.status === 'purchased'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={ord.id} />
											<input type="hidden" name="to_status" value="delivering" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
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
												class="h-8 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
											>
												Selesaikan Pesanan
											</Button>
										</form>
									{/if}

									<a
										href={resolve('/pesanan/[id]', { id: ord.order_number })}
										class="ml-auto text-[11px] font-semibold text-primary hover:underline"
									>
										Detail & Chat &rarr;
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}

	<!-- TAB: PAYMENTS VERIFICATION -->
	{#if activeTab === 'payments'}
		<Card class="border-border/80">
			<CardHeader>
				<CardTitle class="text-base font-bold">Antrean Verifikasi Pembayaran Manual</CardTitle>
				<p class="text-xs text-muted-foreground">
					Periksa bukti transfer atau konfirmasi COD secara manual. Bukti yang diunggah tidak pernah
					otomatis lunas sebelum verifikasi Admin.
				</p>
			</CardHeader>
			<CardContent>
				{#if data.payments.length === 0}
					<div class="py-8 text-center text-xs text-muted-foreground">
						Belum ada catatan transaksi pembayaran manual.
					</div>
				{:else}
					<div class="space-y-3">
						{#each data.payments as pay (pay.id)}
							{@const pMeta = PAYMENT_STATUS_LABELS[pay.status]}
							<div class="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span class="font-mono font-bold text-foreground">
											{pay.payment_reference}
										</span>
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] font-bold {pMeta.badgeClass}"
										>
											{pMeta.label}
										</span>
										<span
											class="rounded bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
										>
											{PAYMENT_METHOD_LABELS[pay.method].shortLabel}
										</span>
									</div>
									<a
										href={resolve('/pesanan/[id]', { id: pay.order_number || pay.order_id })}
										class="text-[11px] font-semibold text-primary hover:underline"
									>
										Detail Pesanan &rarr;
									</a>
								</div>

								<div class="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
									<div>
										<span class="text-muted-foreground">Tagihan:</span>
										<strong class="text-foreground">
											Rp {Number(pay.expected_amount).toLocaleString('id-ID')}
										</strong>
									</div>
									<div>
										<span class="text-muted-foreground">Pengirim:</span>
										<strong class="text-foreground">{pay.payer_name || '-'}</strong>
									</div>
									<div>
										<span class="text-muted-foreground">Ref Eksternal:</span>
										<strong class="font-mono text-foreground">
											{pay.external_reference || '-'}
										</strong>
									</div>
								</div>

								{#if pay.proofSignedUrl && pay.proof_mime_type?.startsWith('image/')}
									<img
										src={pay.proofSignedUrl}
										alt={pay.proof_file_name || 'Bukti transfer'}
										class="max-h-40 rounded-lg border border-border/60 bg-background object-contain"
									/>
								{/if}

								{#if pay.status === 'awaiting_verification' || pay.status === 'unpaid'}
									<div class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
										<form
											method="POST"
											action="?/verifyOrderPayment"
											use:enhance
											class="flex items-center gap-2"
										>
											<input type="hidden" name="order_id" value={pay.order_id} />
											<input
												type="number"
												name="paid_amount"
												value={pay.expected_amount}
												min="0"
												step="500"
												class="h-8 w-32 rounded-md border border-input bg-background px-2 text-xs"
												required
											/>
											<Button
												type="submit"
												size="sm"
												class="h-8 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
											>
												Verifikasi Lunas
											</Button>
										</form>

										{#if pay.status === 'awaiting_verification'}
											<form
												method="POST"
												action="?/rejectOrderPayment"
												use:enhance
												class="flex items-center gap-2"
											>
												<input type="hidden" name="order_id" value={pay.order_id} />
												<Input
													name="rejection_reason"
													type="text"
													placeholder="Alasan tolak..."
													required
													class="h-8 w-44 bg-background text-xs"
												/>
												<Button
													type="submit"
													size="sm"
													variant="destructive"
													class="h-8 text-xs font-bold"
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
			</CardContent>
		</Card>
	{/if}

	<!-- TAB 4: USERS -->
	{#if activeTab === 'users'}
		<Card class="border-border/80">
			<CardHeader>
				<CardTitle class="text-base font-bold">Daftar Pengguna & Hak Akses</CardTitle>
				<p class="text-xs text-muted-foreground">
					Pantau akun yang terdaftar serta modifikasi peran pengguna secara langsung.
				</p>
			</CardHeader>
			<CardContent>
				{#if data.users.length === 0}
					<div class="py-8 text-center text-xs text-muted-foreground">
						Belum ada akun lain yang terdaftar.
					</div>
				{:else}
					<div class="divide-y divide-border/60 rounded-xl border border-border/80">
						{#each data.users as u (u.id)}
							<div class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
								<div>
									<div class="flex items-center gap-2">
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

								<!-- Change Role Quick Form -->
								<form
									method="POST"
									action="?/updateUserRole"
									class="flex items-center gap-2"
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
										class="h-8 rounded-md border border-input bg-background px-2 text-[11px] shadow-xs"
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
										class="h-8 text-[11px]"
									>
										Ubah
									</Button>
								</form>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
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
