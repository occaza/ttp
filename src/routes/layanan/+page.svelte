<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Select } from '#lib/components/ui/select/index.js';
	import {
		Search,
		MapPin,
		Star,
		ShoppingBag,
		Utensils,
		Store,
		Carrot,
		Pill,
		Truck,
		HandHelping,
		Wrench,
		ArrowRight,
		X
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let selectedArea = $state('all');
	let selectedSort = $state('newest');

	$effect(() => {
		searchQuery = data.filters.q;
		selectedCategory = data.filters.kategori;
		selectedArea = data.filters.area;
		selectedSort = data.filters.sort;
	});

	const areas = [
		'Semua Area',
		'Gatak (Pusat)',
		'Gawok & Blimbing',
		'Trangsan & Luwang',
		'Mayang & Sanggung',
		'Kartasura & UMS',
		'Baki & Gentan',
		'Sawit & Sekitarnya'
	];

	const areaOptions = [
		{ value: 'all', label: 'Semua Area (Gatak & Sekitar)' },
		...areas.filter((a) => a !== 'Semua Area').map((a) => ({ value: a, label: a }))
	];

	const sortOptions = [
		{ value: 'newest', label: 'Terbaru' },
		{ value: 'cheapest', label: 'Tarif Terendah' },
		{ value: 'rating', label: 'Rating Tertinggi' }
	];

	function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (searchQuery.trim()) params.set('q', searchQuery.trim());
		if (selectedCategory && selectedCategory !== 'all') params.set('kategori', selectedCategory);
		if (selectedArea && selectedArea !== 'all' && selectedArea !== 'Semua Area')
			params.set('area', selectedArea);
		if (selectedSort && selectedSort !== 'newest') params.set('sort', selectedSort);

		const queryString = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(queryString ? `${resolve('/layanan')}?${queryString}` : resolve('/layanan'), {
			reset: false
		});
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		selectedArea = 'all';
		selectedSort = 'newest';
		void goto(resolve('/layanan'));
	}

	function getCategoryIcon(slug?: string) {
		switch (slug) {
			case 'dititipin':
			case 'shopping-bag':
				return ShoppingBag;
			case 'dianterin':
			case 'pickup-delivery':
			case 'truck':
				return Truck;
			case 'dibantuin':
			case 'hand-helping':
				return HandHelping;
			case 'wrench':
				return Wrench;
			case 'food-beverage':
			case 'utensils':
				return Utensils;
			case 'grocery-mart':
			case 'store':
				return Store;
			case 'traditional-market':
			case 'carrot':
				return Carrot;
			case 'pharmacy':
			case 'pill':
				return Pill;
			default:
				return ShoppingBag;
		}
	}
</script>

<svelte:head>
	<title>Eksplorasi Layanan Jastip Lokal - Titipin</title>
	<meta
		name="description"
		content="Cari dan temukan layanan jasa titip belanja lokal di Gatak, Gawok, Trangsan, Kartasura dan sekitarnya dengan tarif transparan."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Header -->
	<div class="space-y-2 border-b border-border/60 pb-6">
		<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
			Pilihan Layanan Jastip di Area Gatak
		</h1>
		<p class="max-w-2xl text-xs text-muted-foreground sm:text-sm">
			Layanan belanja langsung ke warung, pasar tradisional, minimarket, atau apotek di wilayah
			Gatak dan sekitarnya.
		</p>
	</div>

	<!-- Filter & Search Controls Bar -->
	<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
		<!-- Search and Area Row -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
			<!-- Text Search Input -->
			<div class="relative sm:col-span-6">
				<Search class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
				<Input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari soto, pasar subuh, apotek, minimarket..."
					class="h-10 border-border/70 pl-9 text-xs sm:text-sm"
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') applyFilters();
					}}
				/>
			</div>

			<!-- Area Filter -->
			<div class="relative sm:col-span-4">
				<MapPin
					class="pointer-events-none absolute top-3 left-3 z-10 size-4 text-primary sm:top-2.5"
				/>
				<Select
					bind:value={selectedArea}
					options={areaOptions}
					onchange={applyFilters}
					triggerClass="h-10 pl-9"
				/>
			</div>

			<!-- Sort Filter -->
			<div class="sm:col-span-2">
				<Select
					bind:value={selectedSort}
					options={sortOptions}
					onchange={applyFilters}
					triggerClass="h-10"
				/>
			</div>
		</div>

		<!-- Category Chips -->
		<div class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
			<span class="mr-1 text-[11px] font-bold text-muted-foreground">Kategori:</span>

			<button
				type="button"
				class="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all {selectedCategory ===
				'all'
					? 'bg-primary text-primary-foreground shadow-xs'
					: 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}"
				onclick={() => {
					selectedCategory = 'all';
					applyFilters();
				}}
			>
				Semua Kategori
			</button>

			{#each data.categories as cat (cat.id)}
				<button
					type="button"
					class="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all {selectedCategory ===
					cat.slug
						? 'bg-primary text-primary-foreground shadow-xs'
						: 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}"
					onclick={() => {
						selectedCategory = cat.slug;
						applyFilters();
					}}
				>
					{cat.name}
				</button>
			{/each}

			{#if data.filters.q || data.filters.kategori !== 'all' || data.filters.area !== 'all'}
				<button
					type="button"
					class="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
					onclick={resetFilters}
				>
					<X class="size-3" />
					<span>Reset Filter</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Results Summary -->
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<p>
			Menampilkan <strong>{data.services.length}</strong> penawaran jastip aktif
		</p>
	</div>

	<!-- Services Grid -->
	{#if data.services.length === 0}
		<!-- Empty State -->
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card py-16 text-center shadow-xs"
		>
			<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<Search class="size-6" />
			</div>
			<h3 class="mt-4 text-base font-bold text-foreground">Tidak Ada Layanan yang Cocok</h3>
			<p class="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
				Coba ubah kata kunci pencarian, ganti filter kategori, atau pilih wilayah jangkauan yang
				lebih luas.
			</p>
			<Button variant="outline" size="sm" class="mt-5 text-xs font-semibold" onclick={resetFilters}>
				Tampilkan Semua Layanan
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.services as service (service.id)}
				{@const IconComp = getCategoryIcon(service.category?.slug)}
				<a
					href={resolve('/layanan/[id]', { id: service.id })}
					class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
				>
					<div class="space-y-3">
						<!-- Category & Provider Row -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-1.5">
								<div
									class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
								>
									<IconComp class="size-3.5" />
								</div>
								<span class="text-[11px] font-bold text-muted-foreground">
									{service.category?.name || 'Jastip Lokal'}
								</span>
							</div>

							<div
								class="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"
							>
								<Star class="size-3 fill-current text-amber-500" />
								<span>{Number(service.provider?.rating_avg || 5.0).toFixed(1)}</span>
							</div>
						</div>

						<!-- Title -->
						<div>
							<h3
								class="text-base font-bold text-foreground transition-colors group-hover:text-primary"
							>
								{service.title}
							</h3>
							{#if service.description}
								<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
									{service.description}
								</p>
							{/if}
						</div>

						<!-- Provider Identity -->
						<div class="flex items-center gap-2 border-t border-border/50 pt-2.5 text-xs">
							<div
								class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
							>
								{service.provider?.business_name?.charAt(0).toUpperCase() || 'M'}
							</div>
							<div class="min-w-0 flex-1">
								<span class="block truncate font-semibold text-foreground">
									{service.provider?.business_name || 'Titipin Langsung'}
								</span>
								<span class="block truncate text-[10px] text-muted-foreground">
									{service.coverage_area}
								</span>
							</div>
						</div>
					</div>

					<!-- Pricing & Action Row -->
					<div class="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
						<div>
							<span class="block text-[10px] text-muted-foreground">Tarif Dasar Jastip</span>
							<span class="text-sm font-black text-primary">
								Rp {Number(service.base_fee).toLocaleString('id-ID')}
							</span>
						</div>

						<span
							class="inline-flex items-center gap-1 text-xs font-bold text-primary transition-transform group-hover:translate-x-0.5"
						>
							<span>Detail</span>
							<ArrowRight class="size-3.5" />
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
