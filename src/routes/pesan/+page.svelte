<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Select } from '#lib/components/ui/select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Plus, Trash2, AlertCircle } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	interface ItemInput {
		id: string;
		name: string;
		quantity: number;
		unit: string;
		notes: string;
		estimated_price: number;
	}

	let selectedCategoryId = $state('');
	let selectedServiceId = $state('custom');
	let originName = $state('');
	let originAddress = $state('');
	let selectedAddressId = $state('manual');
	let recipientName = $state('');
	let recipientPhone = $state('');
	let manualAddressText = $state('');
	let customerNotes = $state('');
	let isSubmitting = $state(false);
	let initialized = $state(false);

	let items = $state<ItemInput[]>([
		{
			id: 'item-1',
			name: '',
			quantity: 1,
			unit: 'pcs',
			notes: '',
			estimated_price: 0
		}
	]);

	$effect(() => {
		if (initialized) return;
		initialized = true;

		selectedCategoryId = data.initialCategoryId || data.categories[0]?.id || 'custom';
		selectedServiceId = data.selectedService?.id || 'custom';
		originName = data.defaultOrigin || data.selectedService?.title || '';
		originAddress = data.selectedService?.coverage_area || '';
		selectedAddressId =
			data.addresses.find((a) => a.is_primary)?.id || data.addresses[0]?.id || 'manual';
		recipientName = data.profile?.full_name || '';
		recipientPhone = data.profile?.phone || '';
	});

	const categoryOptions = $derived([
		...data.categories.map((cat) => ({
			value: cat.id,
			label: cat.name
		})),
		{ value: 'custom', label: 'Lainnya / Pesanan Kustom' }
	]);

	const servicesInCategory = $derived(
		selectedCategoryId === 'custom'
			? data.services
			: data.services.filter((s) => s.category_id === selectedCategoryId)
	);

	const serviceOptions = $derived([
		...servicesInCategory.map((svc) => ({
			value: svc.id,
			label: `${svc.title} (Rp ${Number(svc.base_fee).toLocaleString('id-ID')})`
		})),
		{ value: 'custom', label: 'Tulis tempat atau kebutuhan sendiri' }
	]);

	const activeService = $derived(
		selectedServiceId !== 'custom'
			? data.services.find((s) => s.id === selectedServiceId) || data.selectedService || null
			: null
	);

	function handleCategoryChange(nextCategoryId: string) {
		selectedCategoryId = nextCategoryId;
		if (selectedServiceId !== 'custom') {
			const stillValid = data.services.some(
				(s) => s.id === selectedServiceId && s.category_id === nextCategoryId
			);
			if (!stillValid) {
				selectedServiceId = 'custom';
			}
		}
	}

	function handleServiceChange(nextServiceId: string) {
		selectedServiceId = nextServiceId;
		if (nextServiceId === 'custom') return;
		const svc = data.services.find((s) => s.id === nextServiceId);
		if (svc) {
			selectedCategoryId = svc.category_id;
			if (!originName.trim() || data.services.some((s) => s.title === originName.trim())) {
				originName = svc.title;
			}
			if (!originAddress.trim()) {
				originAddress = svc.coverage_area;
			}
		}
	}

	const addressOptions = $derived([
		...data.addresses.map((addr) => ({
			value: addr.id,
			label: `${addr.label} - ${addr.recipient_name} (${addr.street_address})${addr.is_primary ? ' (Utama)' : ''}`
		})),
		{ value: 'manual', label: 'Masukkan alamat baru / manual' }
	]);

	const resolvedAddressText = $derived.by(() => {
		if (selectedAddressId === 'manual') {
			return manualAddressText;
		}
		const found = data.addresses.find((a) => a.id === selectedAddressId);
		if (!found) return manualAddressText;
		return [found.street_address, found.city].filter(Boolean).join(', ');
	});

	function addItem() {
		items.push({
			id: `item-${Date.now()}`,
			name: '',
			quantity: 1,
			unit: 'pcs',
			notes: '',
			estimated_price: 0
		});
	}

	function removeItem(index: number) {
		if (items.length <= 1) return;
		items.splice(index, 1);
	}

	const baseServiceFee = $derived(
		activeService ? Number(activeService.base_fee) : Number(data.pricingRule.base_fee)
	);
	const platformFee = $derived(Number(data.pricingRule.platform_fee));
	const totalServiceFee = $derived(baseServiceFee + platformFee);

	const estimatedItemCost = $derived(
		items.reduce(
			(acc, it) => acc + (Number(it.estimated_price) || 0) * (Number(it.quantity) || 1),
			0
		)
	);
</script>

<svelte:head>
	<title>Buat Pesanan - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
	<header class="max-w-2xl space-y-2 border-b border-border/70 pb-5">
		<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Buat Pesanan</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Pilih layanan atau tulis lokasi tujuan, rincian kebutuhan, dan alamat pengantaran Anda.
		</p>
	</header>

	{#if form?.error}
		<div
			role="alert"
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	<form
		method="POST"
		action="?/createOrder"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}
		class="grid grid-cols-1 gap-8 lg:grid-cols-12"
	>
		<!-- Hidden Form Payload -->
		<input
			type="hidden"
			name="provider_id"
			value={activeService?.provider_id || data.defaultProviderId || ''}
		/>
		<input type="hidden" name="service_id" value={activeService?.id || ''} />
		<input
			type="hidden"
			name="category_id"
			value={activeService?.category_id ||
				(selectedCategoryId !== 'custom' ? selectedCategoryId : '')}
		/>
		<input
			type="hidden"
			name="destination_address_id"
			value={selectedAddressId !== 'manual' ? selectedAddressId : ''}
		/>
		<input type="hidden" name="destination_address_text" value={resolvedAddressText} />
		<input type="hidden" name="items_json" value={JSON.stringify(items)} />

		<!-- Main Form Workspace (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- 1. Service & Origin -->
			<section class="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
				<div class="border-b border-border/60 pb-3">
					<h2 class="text-sm font-bold text-foreground">Layanan &amp; Lokasi Awal</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						Pilih kategori layanan dan titik tempat pembelian atau penjemputan
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<label for="order-category" class="block text-xs font-semibold text-foreground">
							Kategori Layanan
						</label>
						<Select
							id="order-category"
							value={selectedCategoryId}
							options={categoryOptions}
							onchange={handleCategoryChange}
						/>
					</div>

					<div class="space-y-1.5">
						<label for="order-service" class="block text-xs font-semibold text-foreground">
							Pilihan Layanan
						</label>
						<Select
							id="order-service"
							value={selectedServiceId}
							options={serviceOptions}
							onchange={handleServiceChange}
						/>
					</div>
				</div>

				<div class="space-y-3 border-t border-border/50 pt-4">
					<div class="space-y-1.5">
						<label for="origin_name" class="block text-xs font-semibold text-foreground">
							Nama Tempat / Toko / Titik Awal <span class="text-destructive">*</span>
						</label>
						<Input
							id="origin_name"
							name="origin_name"
							type="text"
							bind:value={originName}
							placeholder="Contoh: Mie Gacoan Makamhaji, Roti Sajiyem, Kantor Kelurahan"
							required
							class="text-base sm:text-xs"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="origin_address" class="block text-xs font-semibold text-foreground">
							Patokan / Alamat Lokasi Awal (Opsional)
						</label>
						<Input
							id="origin_address"
							name="origin_address"
							type="text"
							bind:value={originAddress}
							placeholder="Contoh: Sebelah barat stasiun, depan minimarket"
							class="text-base sm:text-xs"
						/>
					</div>
				</div>
			</section>

			<!-- 2. Order Items / Details -->
			<section class="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
				<div class="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
					<div>
						<h2 class="text-sm font-bold text-foreground">Rincian Pesanan</h2>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Tuliskan daftar barang, dokumen, atau pekerjaan yang diminta
						</p>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={addItem}
						class="gap-1.5 text-xs"
					>
						<Plus class="size-3.5" />
						<span>Tambah Baris</span>
					</Button>
				</div>

				<div class="space-y-3">
					{#each items as item, index (item.id)}
						<div class="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-foreground tabular-nums">
									Item {index + 1}
								</span>
								{#if items.length > 1}
									<button
										type="button"
										onclick={() => removeItem(index)}
										aria-label="Hapus item {index + 1}"
										class="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 class="size-4" />
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
								<div class="sm:col-span-7">
									<label
										for={`item-name-${index}`}
										class="mb-1 block text-xs font-semibold text-foreground"
									>
										Nama Barang / Kebutuhan <span class="text-destructive">*</span>
									</label>
									<Input
										id={`item-name-${index}`}
										type="text"
										bind:value={item.name}
										placeholder="Contoh: Mie Suit Level 1, Amplop Dokumen, Survey Lokasi"
										required
										class="text-base sm:text-xs"
									/>
								</div>

								<div class="sm:col-span-2">
									<label
										for={`item-qty-${index}`}
										class="mb-1 block text-xs font-semibold text-foreground"
									>
										Jumlah
									</label>
									<Input
										id={`item-qty-${index}`}
										type="number"
										min="1"
										bind:value={item.quantity}
										class="text-base tabular-nums sm:text-xs"
									/>
								</div>

								<div class="sm:col-span-3">
									<label
										for={`item-unit-${index}`}
										class="mb-1 block text-xs font-semibold text-foreground"
									>
										Satuan
									</label>
									<Input
										id={`item-unit-${index}`}
										type="text"
										bind:value={item.unit}
										placeholder="pcs / porsi / jam"
										class="text-base sm:text-xs"
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
								<div class="sm:col-span-5">
									<label
										for={`item-price-${index}`}
										class="mb-1 block text-xs font-semibold text-foreground"
									>
										Estimasi Harga Satuan (Rp)
									</label>
									<Input
										id={`item-price-${index}`}
										type="number"
										min="0"
										step="500"
										bind:value={item.estimated_price}
										placeholder="0 jika tidak ada belanja barang"
										class="text-base tabular-nums sm:text-xs"
									/>
								</div>

								<div class="sm:col-span-7">
									<label
										for={`item-notes-${index}`}
										class="mb-1 block text-xs font-semibold text-foreground"
									>
										Catatan Khusus
									</label>
									<Input
										id={`item-notes-${index}`}
										type="text"
										bind:value={item.notes}
										placeholder="Contoh: Tanpa seledri, titip foto lokasi"
										class="text-base sm:text-xs"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- 3. Destination & Recipient -->
			<section class="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
				<div class="border-b border-border/60 pb-3">
					<h2 class="text-sm font-bold text-foreground">Tujuan Pengantaran &amp; Penerima</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						Pilih alamat tersimpan atau masukkan alamat tujuan secara langsung
					</p>
				</div>

				{#if data.addresses.length > 0}
					<div class="space-y-1.5">
						<label for="address-selector" class="block text-xs font-semibold text-foreground">
							Pilih Alamat Tersimpan
						</label>
						<Select id="address-selector" bind:value={selectedAddressId} options={addressOptions} />
					</div>
				{/if}

				{#if selectedAddressId === 'manual' || data.addresses.length === 0}
					<div class="space-y-3 border-t border-border/50 pt-4">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div class="space-y-1.5">
								<label for="recipient_name" class="block text-xs font-semibold text-foreground">
									Nama Penerima <span class="text-destructive">*</span>
								</label>
								<Input
									id="recipient_name"
									name="recipient_name"
									type="text"
									bind:value={recipientName}
									placeholder="Nama lengkap penerima"
									required
									class="text-base sm:text-xs"
								/>
							</div>
							<div class="space-y-1.5">
								<label for="recipient_phone" class="block text-xs font-semibold text-foreground">
									Nomor WhatsApp / Telepon <span class="text-destructive">*</span>
								</label>
								<Input
									id="recipient_phone"
									name="recipient_phone"
									type="tel"
									bind:value={recipientPhone}
									placeholder="08xxxxxxxxxx"
									required
									class="text-base tabular-nums sm:text-xs"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="manual_address" class="block text-xs font-semibold text-foreground">
								Alamat Lengkap Tujuan <span class="text-destructive">*</span>
							</label>
							<Textarea
								id="manual_address"
								bind:value={manualAddressText}
								rows={3}
								placeholder="Tuliskan nama jalan, nomor rumah, RT/RW, dan patokan terdekat"
								required={selectedAddressId === 'manual'}
								class="text-base sm:text-xs"
							/>
						</div>
					</div>
				{/if}

				<div class="space-y-1.5 border-t border-border/50 pt-4">
					<label for="customer_notes" class="block text-xs font-semibold text-foreground">
						Catatan untuk Petugas (Opsional)
					</label>
					<Input
						id="customer_notes"
						name="customer_notes"
						type="text"
						bind:value={customerNotes}
						placeholder="Contoh: Hubungi sebelum berangkat, titipkan di pos depan"
						class="text-base sm:text-xs"
					/>
				</div>
			</section>
		</div>

		<!-- Sticky Cost Summary (4 cols) -->
		<aside class="lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
			<div class="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
				<div class="border-b border-border/60 pb-3">
					<h2 class="text-sm font-bold text-foreground">Ringkasan Biaya</h2>
					{#if activeService}
						<p class="mt-0.5 truncate text-xs text-muted-foreground">{activeService.title}</p>
					{:else}
						<p class="mt-0.5 text-xs text-muted-foreground">{data.pricingRule.name}</p>
					{/if}
				</div>

				<dl class="space-y-2.5 text-xs">
					<div class="flex items-center justify-between">
						<dt class="text-muted-foreground">Tarif Layanan</dt>
						<dd class="font-semibold text-foreground tabular-nums">
							Rp {baseServiceFee.toLocaleString('id-ID')}
						</dd>
					</div>

					<div class="flex items-center justify-between">
						<dt class="text-muted-foreground">Biaya Platform</dt>
						<dd class="font-semibold text-foreground tabular-nums">
							Rp {platformFee.toLocaleString('id-ID')}
						</dd>
					</div>

					<div class="flex items-center justify-between border-t border-border/60 pt-2.5">
						<dt class="font-bold text-foreground">Total Biaya Jasa</dt>
						<dd class="text-base font-extrabold text-primary tabular-nums">
							Rp {totalServiceFee.toLocaleString('id-ID')}
						</dd>
					</div>

					{#if estimatedItemCost > 0}
						<div
							class="flex items-center justify-between border-t border-dashed border-border/60 pt-2.5"
						>
							<dt class="text-muted-foreground">Estimasi Belanja</dt>
							<dd class="font-semibold text-foreground tabular-nums">
								Rp {estimatedItemCost.toLocaleString('id-ID')}
							</dd>
						</div>
					{/if}
				</dl>

				<p
					class="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"
				>
					Jika ada pembelian barang di lokasi, total belanja dibayarkan sesuai nota asli.
				</p>

				<Button type="submit" disabled={isSubmitting} class="h-11 w-full text-xs font-bold">
					{isSubmitting ? 'Memproses Pesanan...' : 'Kirim Pesanan'}
				</Button>
			</div>
		</aside>
	</form>
</div>
