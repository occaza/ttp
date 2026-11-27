<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import {
		Store,
		CheckCircle2,
		Plus,
		Edit3,
		Trash2,
		AlertCircle,
		MapPin,
		Sparkles,
		X,
		Star,
		Power,
		ShoppingBag
	} from 'lucide-svelte';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import { PAYMENT_STATUS_LABELS } from '#lib/constants/payment.js';
	import type { ProviderService } from '#lib/types/database.types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isServiceModalOpen = $state(false);
	let isEditingProfile = $state(false);
	let editingService = $state<ProviderService | null>(null);
	let savingService = $state(false);
	let serviceModalError = $state('');

	// Form fields
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

	function closeServiceModal() {
		isServiceModalOpen = false;
		editingService = null;
		serviceModalError = '';
	}

	const categoryMap = $derived(new Map(data.categories.map((c) => [c.id, c.name])));
</script>

<svelte:head>
	<title>Dashboard Mitra - Titipin</title>
	<meta
		name="description"
		content="Area kerja mitra jastip: kelola penawaran layanan, tarif dasar, dan jangkauan area operasional."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Top Bar -->
	<div
		class="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<div class="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase">
				<Store class="size-4" />
				<span>Area Kerja Mitra Jastip</span>
			</div>
			<h1 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Dashboard Operasional Mitra
			</h1>
			<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
				Atur ketersediaan terima pesanan, jangkauan rute, dan tarif jasa titip Anda.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				href={resolve('/profil')}
				class="h-9 gap-1.5 text-xs font-semibold"
			>
				<span>Profil Pengguna</span>
			</Button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if form?.serviceSuccess || form?.providerSuccess}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.serviceSuccess || form.providerSuccess}</span>
		</div>
	{/if}

	{#if form?.serviceError || form?.providerError}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.serviceError || form.providerError}</span>
		</div>
	{/if}

	<!-- Operational Availability Banner -->
	<div
		class="flex flex-col items-start justify-between gap-4 rounded-2xl border {data.providerProfile
			?.is_active
			? 'border-emerald-500/30 bg-emerald-500/5'
			: 'border-border/80 bg-muted/30'} p-5 sm:flex-row sm:items-center"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span
					class="size-2.5 rounded-full {data.providerProfile?.is_active
						? 'animate-pulse bg-emerald-500'
						: 'bg-muted-foreground'}"
				></span>
				<span class="text-sm font-bold text-foreground">
					Status Operasional: {data.providerProfile?.is_active
						? 'Buka (Siap Menerima Pesanan)'
						: 'Tutup Sementara'}
				</span>
			</div>
			<p class="text-xs text-muted-foreground">
				{#if data.providerProfile?.is_active}
					Profil dan penawaran layanan Anda tampil aktif bagi pelanggan di Gatak dan sekitarnya.
				{:else}
					Pesanan baru dihentikan sementara. Aktifkan kembali ketika Anda siap berangkat belanja.
				{/if}
			</p>
		</div>

		<form method="POST" action="?/toggleAvailability" use:enhance>
			<input type="hidden" name="current_status" value={String(data.providerProfile?.is_active)} />
			<Button
				type="submit"
				size="sm"
				class="h-9 gap-2 text-xs font-bold {data.providerProfile?.is_active
					? 'bg-amber-600 text-white hover:bg-amber-700'
					: 'bg-primary text-primary-foreground hover:bg-primary/95'}"
			>
				<Power class="size-3.5" />
				<span>{data.providerProfile?.is_active ? 'Tutup Pesanan' : 'Buka Pesanan Sekarang'}</span>
			</Button>
		</form>
	</div>

	<!-- 4 Key Metrics -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div class="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
			<span class="text-[11px] font-semibold text-muted-foreground">Total Layanan</span>
			<p class="mt-1 text-2xl font-black text-foreground">{data.stats.totalServices}</p>
			<span class="text-[10px] text-muted-foreground">Penawaran terdaftar</span>
		</div>
		<div class="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
			<span class="text-[11px] font-semibold text-muted-foreground">Layanan Aktif</span>
			<p class="mt-1 text-2xl font-black text-emerald-600">{data.stats.activeServices}</p>
			<span class="text-[10px] text-muted-foreground">Tampil di katalog</span>
		</div>
		<div class="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
			<span class="text-[11px] font-semibold text-muted-foreground">Rata-rata Tarif</span>
			<p class="mt-1 text-2xl font-black text-foreground">
				Rp {data.stats.avgBaseFee.toLocaleString('id-ID')}
			</p>
			<span class="text-[10px] text-muted-foreground">Biaya jasa basis</span>
		</div>
		<div class="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
			<span class="text-[11px] font-semibold text-muted-foreground">Rating Mitra</span>
			<div class="mt-1 flex items-center gap-1.5">
				<Star class="size-5 fill-amber-400 text-amber-400" />
				<span class="text-2xl font-black text-foreground">
					{Number(data.providerProfile?.rating_avg || 5.0).toFixed(1)}
				</span>
			</div>
			<span class="text-[10px] text-muted-foreground">
				{data.providerProfile?.rating_count || 0} Ulasan Pelanggan
			</span>
		</div>
	</div>

	<!-- Main Grid: Provider Profile & Service Listings -->
	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
		<!-- Left: Profile & Coverage (4 cols) -->
		<div class="space-y-6 lg:col-span-4">
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<h2 class="text-sm font-bold text-foreground">Profil Usaha & Wilayah</h2>
					<button
						type="button"
						class="text-xs font-semibold text-primary hover:underline"
						onclick={() => (isEditingProfile = !isEditingProfile)}
					>
						{isEditingProfile ? 'Batal' : 'Edit'}
					</button>
				</div>

				{#if isEditingProfile}
					<form method="POST" action="?/updateProfile" class="mt-4 space-y-3.5" use:enhance>
						<div class="space-y-1">
							<Label for="business_name" class="text-xs font-semibold">Nama Usaha / Mitra</Label>
							<Input
								id="business_name"
								name="business_name"
								value={data.providerProfile?.business_name || ''}
								required
								class="h-9 text-xs"
							/>
						</div>

						<div class="space-y-1">
							<Label for="coverage_area" class="text-xs font-semibold">Cakupan Area Layanan</Label>
							<Input
								id="coverage_area"
								name="coverage_area"
								value={data.providerProfile?.coverage_area || 'Gatak, Gawok, Trangsan, Mayang'}
								required
								class="h-9 text-xs"
							/>
						</div>

						<div class="space-y-1">
							<Label for="bio" class="text-xs font-semibold">Bio & Pengalaman Belanja</Label>
							<Textarea
								id="bio"
								name="bio"
								value={data.providerProfile?.bio || ''}
								rows={3}
								placeholder="Ceritakan rute belanja harian atau keahlian Anda..."
								class="text-xs"
							/>
						</div>

						<div class="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								type="button"
								class="h-8 text-xs"
								onclick={() => (isEditingProfile = false)}
							>
								Batal
							</Button>
							<Button size="sm" type="submit" class="h-8 text-xs font-bold">Simpan</Button>
						</div>
					</form>
				{:else}
					<div class="mt-4 space-y-3 text-xs">
						<div class="rounded-xl border border-border/60 bg-muted/20 p-3">
							<span class="block text-[11px] text-muted-foreground">Nama Layanan</span>
							<p class="font-bold text-foreground">
								{data.providerProfile?.business_name || 'Mitra Jastip Gatak'}
							</p>
						</div>

						<div class="rounded-xl border border-border/60 bg-muted/20 p-3">
							<span class="block text-[11px] text-muted-foreground">Cakupan Area Operasional</span>
							<p class="font-medium text-foreground">
								{data.providerProfile?.coverage_area || 'Gatak, Gawok, Trangsan, Mayang'}
							</p>
						</div>

						<div class="rounded-xl border border-border/60 bg-muted/20 p-3">
							<span class="block text-[11px] text-muted-foreground">Bio / Catatan</span>
							<p class="leading-relaxed text-muted-foreground">
								{data.providerProfile?.bio || 'Siap melayani jastip belanja kebutuhan warga lokal.'}
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Services Management (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Incoming & Active Orders Section -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div class="flex items-center gap-2">
						<ShoppingBag class="size-4 text-primary" />
						<h2 class="text-sm font-bold text-foreground">Pesanan Masuk & Sedang Berjalan</h2>
					</div>
					<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
						{data.orders.filter((o) => !['completed', 'cancelled', 'rejected'].includes(o.status))
							.length} Aktif
					</span>
				</div>

				{#if data.orders.length === 0}
					<div
						class="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground"
					>
						Belum ada pesanan masuk dari pelanggan.
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.orders as order (order.id)}
							{@const statusMeta = ORDER_STATUS_LABELS[order.status] || {
								label: order.status,
								badgeClass: 'bg-muted text-muted-foreground'
							}}
							{@const payMeta = PAYMENT_STATUS_LABELS[order.paymentStatus]}
							<div class="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
								<div
									class="flex flex-col gap-2 border-b border-border/50 pb-2.5 sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="flex flex-wrap items-center gap-2">
										<span class="font-mono text-xs font-bold text-foreground">
											{order.order_number}
										</span>
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] font-bold {statusMeta.badgeClass}"
										>
											{statusMeta.label}
										</span>
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] font-bold {payMeta.badgeClass}"
										>
											Bayar: {payMeta.label}
										</span>
									</div>
									<span class="text-[10px] text-muted-foreground">
										{new Date(order.created_at).toLocaleTimeString('id-ID', {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>

								<div class="space-y-1 text-xs">
									<p class="font-bold text-foreground">{order.origin_name}</p>
									<p class="text-muted-foreground">{order.destination_address_text}</p>
									<p class="text-[11px] text-muted-foreground">
										Pemesan: <span class="font-semibold text-foreground">
											{order.recipient_name} ({order.recipient_phone})
										</span>
									</p>
									<div class="rounded-lg bg-card p-2 text-[11px] text-foreground">
										<span class="font-semibold">Barang:</span>
										{order.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
									</div>
								</div>

								<!-- Action transitions based on state -->
								<div class="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2.5">
									{#if order.status === 'pending'}
										<form method="POST" action="?/updateOrderStatus" use:enhance class="flex gap-2">
											<input type="hidden" name="order_id" value={order.id} />
											<input type="hidden" name="to_status" value="accepted" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Terima Pesanan
											</Button>
										</form>
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={order.id} />
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
									{:else if order.status === 'accepted'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={order.id} />
											<input type="hidden" name="to_status" value="shopping" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Mulai Belanja di Toko
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
											<input type="hidden" name="to_status" value="purchased" />
											<Input
												name="actual_item_cost"
												type="number"
												min="0"
												step="500"
												placeholder="Total nota fisik (Rp)"
												class="h-8 w-36 text-xs"
												required
											/>
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Selesai Belanja (Ada Struk)
											</Button>
										</form>
									{:else if order.status === 'purchased'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={order.id} />
											<input type="hidden" name="to_status" value="delivering" />
											<Button size="sm" type="submit" class="h-8 text-xs font-bold">
												Berangkat Antar ke Alamat
											</Button>
										</form>
									{:else if order.status === 'delivering'}
										<form method="POST" action="?/updateOrderStatus" use:enhance>
											<input type="hidden" name="order_id" value={order.id} />
											<input type="hidden" name="to_status" value="completed" />
											<Button
												size="sm"
												type="submit"
												class="h-8 bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
											>
												Selesaikan Pesanan
											</Button>
										</form>
									{:else}
										<span class="text-[11px] text-muted-foreground">
											Pesanan telah selesai/ditutup.
										</span>
									{/if}

									<a
										href={resolve('/pesanan/[id]', { id: order.order_number })}
										class="ml-auto text-[11px] font-semibold text-primary hover:underline"
									>
										Lihat Detail &rarr;
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div
					class="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<h2 class="text-sm font-bold text-foreground">Daftar Layanan Jastip Ditawarkan</h2>
						<p class="text-xs text-muted-foreground">
							Tentukan kategori, tarif flat jasa titip, dan area spesifik yang Anda sanggupi.
						</p>
					</div>

					<Button
						size="sm"
						class="h-8 gap-1.5 rounded-xl text-xs font-semibold"
						onclick={openAddServiceModal}
					>
						<Plus class="size-3.5" />
						<span>Tambah Layanan Jastip</span>
					</Button>
				</div>

				<div class="mt-5">
					{#if data.services.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-12 text-center"
						>
							<div
								class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<Sparkles class="size-6" />
							</div>
							<h3 class="mt-3 text-sm font-bold text-foreground">Belum ada penawaran layanan</h3>
							<p class="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
								Daftarkan penawaran jastip pertama Anda (misal: "Jastip Soto Gawok", "Belanja Pasar
								Subuh") agar tampil di pencarian pelanggan.
							</p>
							<Button
								size="sm"
								class="mt-5 h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-xs"
								onclick={openAddServiceModal}
							>
								<Plus class="size-3.5" />
								<span>Tambah Layanan Pertama</span>
							</Button>
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#each data.services as service (service.id)}
								<div
									class="relative flex flex-col justify-between rounded-xl border {service.is_active
										? 'border-border/80 bg-card'
										: 'border-border/50 bg-muted/30 opacity-75'} p-4 shadow-2xs transition-all hover:border-primary/40"
								>
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<span
												class="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
											>
												{categoryMap.get(service.category_id) || 'Kategori Jastip'}
											</span>
											<span
												class="rounded-full px-2 py-0.5 text-[10px] font-semibold {service.is_active
													? 'bg-emerald-500/10 text-emerald-600'
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

										<div class="flex items-baseline gap-1 border-t border-border/60 pt-2">
											<span class="text-xs font-medium text-muted-foreground">Tarif Jastip:</span>
											<span class="text-sm font-black text-primary">
												Rp {Number(service.base_fee).toLocaleString('id-ID')}
											</span>
										</div>

										<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
											<MapPin class="size-3 shrink-0 text-primary" />
											<span class="truncate">{service.coverage_area}</span>
										</div>
									</div>

									<div
										class="mt-4 flex items-center justify-between border-t border-border/60 pt-3"
									>
										<form method="POST" action="?/toggleServiceActive" use:enhance>
											<input type="hidden" name="id" value={service.id} />
											<button
												type="submit"
												class="text-[11px] font-medium {service.is_active
													? 'text-amber-600 hover:underline'
													: 'text-emerald-600 hover:underline'}"
											>
												{service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
											</button>
										</form>

										<div class="flex items-center gap-1">
											<button
												type="button"
												class="inline-flex h-7 items-center rounded-lg border border-border/70 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
												onclick={() => openEditServiceModal(service)}
												title="Edit Layanan"
											>
												<Edit3 class="mr-1 size-3" />
												<span>Edit</span>
											</button>

											<form
												method="POST"
												action="?/deleteService"
												use:enhance
												onsubmit={(e) => {
													if (!confirm(`Hapus layanan "${service.title}"?`)) e.preventDefault();
												}}
											>
												<input type="hidden" name="id" value={service.id} />
												<button
													type="submit"
													class="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
													title="Hapus Layanan"
												>
													<Trash2 class="size-3" />
													<span class="sr-only">Hapus</span>
												</button>
											</form>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal Tambah / Edit Layanan Jastip -->
{#if isServiceModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
			<div class="flex items-center justify-between border-b border-border/60 pb-3">
				<div>
					<h3 class="text-base font-bold text-foreground">
						{editingService ? 'Ubah Penawaran Jastip' : 'Tambah Layanan Jastip Baru'}
					</h3>
					<p class="text-[11px] text-muted-foreground">
						Layanan ini akan tampil di katalog pencarian pelanggan Titipin.
					</p>
				</div>
				<button
					type="button"
					class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					onclick={closeServiceModal}
					aria-label="Tutup"
				>
					<X class="size-4" />
				</button>
			</div>

			{#if serviceModalError}
				<div
					class="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0" />
					<span>{serviceModalError}</span>
				</div>
			{/if}

			<form
				method="POST"
				action="?/saveService"
				class="mt-4 space-y-3.5"
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
					<select
						id="category_id"
						name="category_id"
						bind:value={categoryId}
						required
						class="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus:ring-1 focus:ring-ring"
					>
						{#each data.categories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-1">
					<Label for="title" class="text-xs font-semibold">Judul Layanan</Label>
					<Input
						id="title"
						name="title"
						bind:value={serviceTitle}
						placeholder="Contoh: Jastip Soto Bebek Gawok / Belanja Pasar Pagi"
						required
						class="h-9 text-xs"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
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
							class="h-9 text-xs font-bold text-primary"
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
							class="h-9 text-xs"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<Label for="description" class="text-xs font-semibold">
						Deskripsi / Ketentuan Khusus
					</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={serviceDescription}
						placeholder="Misal: Siap belanja jam 06.00 - 10.00 subuh. Struk kasir pasar difoto langsung."
						rows={2}
						class="text-xs"
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

				<div class="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
					<Button
						variant="outline"
						size="sm"
						type="button"
						onclick={closeServiceModal}
						class="text-xs"
						disabled={savingService}
					>
						Batal
					</Button>
					<Button size="sm" type="submit" class="text-xs font-bold" disabled={savingService}>
						{#if savingService}
							<span
								class="mr-1.5 size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></span>
							<span>Menyimpan...</span>
						{:else}
							<span>{editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}</span>
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
