<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		ShoppingBag,
		MapPin,
		Plus,
		Trash2,
		Receipt,
		ArrowRight,
		AlertCircle
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form states
	let originName = $state('');
	let originAddress = $state('Kecamatan Gatak & Sekitarnya');
	let selectedAddressId = $state('manual');
	let recipientName = $state('');
	let recipientPhone = $state('');
	let manualAddressText = $state('');
	let customerNotes = $state('');

	// Items list
	interface ItemInput {
		id: string;
		name: string;
		quantity: number;
		unit: string;
		notes: string;
		estimated_price: number;
	}

	let items = $state<ItemInput[]>([
		{
			id: 'item-1',
			name: 'Soto Bebek Bungkus',
			quantity: 1,
			unit: 'porsi',
			notes: 'Kuah dan sambal dipisah',
			estimated_price: 15000
		}
	]);

	$effect(() => {
		originName =
			data.defaultOrigin ||
			data.selectedService?.title?.replace(/^Jastip\s+/i, '') ||
			'Warung / Toko di Gatak';
		originAddress = data.selectedService?.coverage_area || 'Kecamatan Gatak & Sekitarnya';
		selectedAddressId =
			data.addresses.find((a) => a.is_primary)?.id || data.addresses[0]?.id || 'manual';
		recipientName = data.profile?.full_name || '';
		recipientPhone = data.profile?.phone || '';
		if (data.selectedService?.title && items[0]?.name === 'Soto Bebek Bungkus') {
			items[0].name = `Pesanan ${data.selectedService.title}`;
		}
	});

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
			estimated_price: 10000
		});
	}

	function removeItem(index: number) {
		if (items.length <= 1) return;
		items.splice(index, 1);
	}

	// Live fee calculations
	const baseJastipFee = $derived(Number(data.selectedService?.base_fee) || 8000);
	const platformFee = 1000;
	const totalJastipFee = $derived(baseJastipFee + platformFee);

	const estimatedItemCost = $derived(
		items.reduce(
			(acc, it) => acc + (Number(it.estimated_price) || 0) * (Number(it.quantity) || 1),
			0
		)
	);

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Buat Pesanan Jastip - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Page Header -->
	<div class="space-y-1.5 border-b border-border/60 pb-5">
		<div
			class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
		>
			<ShoppingBag class="size-3.5" />
			<span>Formulir Pesanan Jastip</span>
		</div>
		<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
			Titip Belanja & Pengantaran
		</h1>
		<p class="text-xs text-muted-foreground sm:text-sm">
			Tuliskan toko tujuan, daftar barang, dan alamat pengantaran. Harga belanjaan murni sesuai nota
			fisik toko.
		</p>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive"
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
			value={data.selectedService?.provider_id || data.defaultProviderId || ''}
		/>
		<input type="hidden" name="service_id" value={data.selectedService?.id || ''} />
		<input type="hidden" name="category_id" value={data.selectedService?.category_id || ''} />
		<input
			type="hidden"
			name="destination_address_id"
			value={selectedAddressId !== 'manual' ? selectedAddressId : ''}
		/>
		<input type="hidden" name="destination_address_text" value={resolvedAddressText} />
		<input type="hidden" name="items_json" value={JSON.stringify(items)} />

		<!-- Left Form Inputs (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Store / Origin Section -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center gap-2 border-b border-border/60 pb-3">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<MapPin class="size-4" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-foreground">Lokasi Toko / Warung Asal</h2>
						<p class="text-[11px] text-muted-foreground">Tempat pembelian belanjaan Anda</p>
					</div>
				</div>

				<div class="space-y-3">
					<div>
						<label for="origin_name" class="mb-1 block text-xs font-semibold text-foreground">
							Nama Warung / Toko / Pasar <span class="text-destructive">*</span>
						</label>
						<Input
							id="origin_name"
							name="origin_name"
							type="text"
							bind:value={originName}
							placeholder="Contoh: Soto Bebek Gawok, Pasar Subuh Gawok, Toko Kelontong Bu Sri"
							required
							class="text-xs"
						/>
					</div>

					<div>
						<label for="origin_address" class="mb-1 block text-xs font-semibold text-foreground">
							Alamat / Patokan Toko (Opsional)
						</label>
						<Input
							id="origin_address"
							name="origin_address"
							type="text"
							bind:value={originAddress}
							placeholder="Contoh: Sebelah barat rel stasiun Gawok, depan gapura"
							class="text-xs"
						/>
					</div>
				</div>
			</div>

			<!-- Shopping Items Section -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div class="flex items-center gap-2">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<ShoppingBag class="size-4" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-foreground">Daftar Barang Titipan</h2>
							<p class="text-[11px] text-muted-foreground">
								Cantumkan rincian pesanan secara teliti
							</p>
						</div>
					</div>

					<button
						type="button"
						onclick={addItem}
						class="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
					>
						<Plus class="size-3.5" />
						<span>Tambah Item</span>
					</button>
				</div>

				<div class="space-y-4">
					{#each items as item, index (item.id)}
						<div class="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-foreground">Item #{index + 1}</span>
								{#if items.length > 1}
									<button
										type="button"
										onclick={() => removeItem(index)}
										class="text-destructive/80 transition-colors hover:text-destructive"
										title="Hapus item"
									>
										<Trash2 class="size-4" />
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
								<div class="sm:col-span-8">
									<label
										for={`item-name-${index}`}
										class="mb-1 block text-[11px] font-semibold text-foreground"
									>
										Nama Barang / Menu <span class="text-destructive">*</span>
									</label>
									<Input
										id={`item-name-${index}`}
										type="text"
										bind:value={item.name}
										placeholder="Misal: Soto Bebek, Minyak Goreng 2L, dll"
										required
										class="text-xs"
									/>
								</div>

								<div class="sm:col-span-2">
									<label
										for={`item-qty-${index}`}
										class="mb-1 block text-[11px] font-semibold text-foreground"
									>
										Jumlah
									</label>
									<Input
										id={`item-qty-${index}`}
										type="number"
										min="1"
										bind:value={item.quantity}
										class="text-xs"
									/>
								</div>

								<div class="sm:col-span-2">
									<label
										for={`item-unit-${index}`}
										class="mb-1 block text-[11px] font-semibold text-foreground"
									>
										Satuan
									</label>
									<Input
										id={`item-unit-${index}`}
										type="text"
										bind:value={item.unit}
										placeholder="porsi / pcs / kg"
										class="text-xs"
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
								<div class="sm:col-span-6">
									<label
										for={`item-price-${index}`}
										class="mb-1 block text-[11px] font-semibold text-foreground"
									>
										Estimasi Harga Satuan (Rp)
									</label>
									<Input
										id={`item-price-${index}`}
										type="number"
										min="0"
										step="1000"
										bind:value={item.estimated_price}
										placeholder="15000"
										class="text-xs"
									/>
								</div>

								<div class="sm:col-span-6">
									<label
										for={`item-notes-${index}`}
										class="mb-1 block text-[11px] font-semibold text-foreground"
									>
										Catatan Khusus
									</label>
									<Input
										id={`item-notes-${index}`}
										type="text"
										bind:value={item.notes}
										placeholder="Misal: jangan pedas, pilih yang matang"
										class="text-xs"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Delivery Destination Address -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div class="flex items-center gap-2 border-b border-border/60 pb-3">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<MapPin class="size-4" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-foreground">Alamat Tujuan Pengantaran</h2>
						<p class="text-[11px] text-muted-foreground">Lokasi rumah, kantor, atau kost Anda</p>
					</div>
				</div>

				{#if data.addresses.length > 0}
					<div class="space-y-2">
						<label for="address-selector" class="block text-xs font-semibold text-foreground">
							Pilih Alamat Tersimpan
						</label>
						<select
							id="address-selector"
							bind:value={selectedAddressId}
							class="w-full rounded-md border border-input bg-background p-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-ring"
						>
							{#each data.addresses as addr (addr.id)}
								<option value={addr.id}>
									{addr.label} &bull; {addr.recipient_name} ({addr.street_address}) {addr.is_primary
										? '★ Utama'
										: ''}
								</option>
							{/each}
							<option value="manual">+ Masukkan Alamat Baru / Manual</option>
						</select>
					</div>
				{/if}

				{#if selectedAddressId === 'manual' || data.addresses.length === 0}
					<div class="space-y-3 border-t border-border/50 pt-3">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label
									for="recipient_name"
									class="mb-1 block text-xs font-semibold text-foreground"
								>
									Nama Penerima <span class="text-destructive">*</span>
								</label>
								<Input
									id="recipient_name"
									name="recipient_name"
									type="text"
									bind:value={recipientName}
									required
									class="text-xs"
								/>
							</div>
							<div>
								<label
									for="recipient_phone"
									class="mb-1 block text-xs font-semibold text-foreground"
								>
									Nomor Telepon / WhatsApp <span class="text-destructive">*</span>
								</label>
								<Input
									id="recipient_phone"
									name="recipient_phone"
									type="tel"
									bind:value={recipientPhone}
									required
									class="text-xs"
								/>
							</div>
						</div>

						<div>
							<label for="manual_address" class="mb-1 block text-xs font-semibold text-foreground">
								Alamat Lengkap Pengantaran <span class="text-destructive">*</span>
							</label>
							<textarea
								id="manual_address"
								bind:value={manualAddressText}
								rows="3"
								placeholder="Contoh: Jl. Stasiun Gawok No. 12, RT 02/RW 01, Krapyak, Gatak (Pagar hitam)"
								required={selectedAddressId === 'manual'}
								class="w-full rounded-md border border-input bg-transparent p-2 text-xs shadow-xs focus:ring-1 focus:ring-ring"
							></textarea>
						</div>
					</div>
				{/if}

				<!-- Customer Extra Notes -->
				<div class="border-t border-border/50 pt-3">
					<label for="customer_notes" class="mb-1 block text-xs font-semibold text-foreground">
						Catatan Tambahan untuk Pengantar (Opsional)
					</label>
					<Input
						id="customer_notes"
						name="customer_notes"
						type="text"
						bind:value={customerNotes}
						placeholder="Misal: Titipkan ke satpam, hubungi sebelum jalan, dll"
						class="text-xs"
					/>
				</div>
			</div>
		</div>

		<!-- Right Summary Box (4 cols) -->
		<div class="space-y-6 lg:sticky lg:top-20 lg:col-span-4">
			<div class="space-y-4 rounded-2xl border border-primary/30 bg-card p-6 shadow-md">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<span class="text-xs font-bold text-foreground">Ringkasan Biaya Jastip</span>
					<span class="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
						100% Struk Toko Asli
					</span>
				</div>

				<div class="space-y-2 text-xs">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Tarif Jasa Titip (Flat)</span>
						<span class="font-bold text-foreground">
							Rp {baseJastipFee.toLocaleString('id-ID')}
						</span>
					</div>

					<div class="flex justify-between">
						<span class="text-muted-foreground">Biaya Platform Titipin</span>
						<span class="font-bold text-foreground">Rp {platformFee.toLocaleString('id-ID')}</span>
					</div>

					<div class="flex justify-between border-t border-border/50 pt-2 font-bold">
						<span class="text-foreground">Total Ongkos Jastip</span>
						<span class="text-primary">Rp {totalJastipFee.toLocaleString('id-ID')}</span>
					</div>

					{#if estimatedItemCost > 0}
						<div
							class="flex justify-between border-t border-dashed border-border/60 pt-2 text-muted-foreground"
						>
							<span>Estimasi Belanja Toko</span>
							<span class="font-semibold text-foreground">
								Rp {estimatedItemCost.toLocaleString('id-ID')}
							</span>
						</div>
					{/if}
				</div>

				<div
					class="rounded-xl border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground"
				>
					<div class="flex items-start gap-1.5 font-semibold text-foreground">
						<Receipt class="mt-0.5 size-3.5 shrink-0 text-primary" />
						<span>Prinsip Belanja Titipin</span>
					</div>
					<p class="mt-1">
						Nominal belanjaan dihitung 100% sesuai struk fisik kasir toko saat barang dibeli, tanpa
						biaya terselubung.
					</p>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					class="h-11 w-full gap-2 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-98"
				>
					{#if isSubmitting}
						<span>Memproses Pesanan...</span>
					{:else}
						<span>Kirim Pesanan Jastip</span>
						<ArrowRight class="size-4" />
					{/if}
				</Button>
			</div>
		</div>
	</form>
</div>
