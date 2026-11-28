<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import {
		Utensils,
		Store,
		Carrot,
		Pill,
		ShoppingBag,
		Truck,
		HandHelping,
		Wrench,
		Search,
		ChevronRight,
		X
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	function getCategoryIcon(iconName: string, slug?: string) {
		const key = iconName || slug || '';
		switch (key) {
			case 'hand-helping':
			case 'dibantuin':
				return HandHelping;
			case 'wrench':
				return Wrench;
			case 'utensils':
				return Utensils;
			case 'store':
				return Store;
			case 'carrot':
				return Carrot;
			case 'pill':
				return Pill;
			case 'truck':
			case 'dianterin':
				return Truck;
			default:
				return ShoppingBag;
		}
	}

	const filteredCategories = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return data.categories;
		return data.categories.filter((cat) => {
			const catServices = data.servicesByCategory[cat.id] ?? [];
			return (
				cat.name.toLowerCase().includes(q) ||
				(cat.description ?? '').toLowerCase().includes(q) ||
				catServices.some((s) => s.title.toLowerCase().includes(q))
			);
		});
	});

	const featuredCategory = $derived(
		!searchQuery.trim() && filteredCategories.length > 0 ? filteredCategories[0] : null
	);
	const secondaryCategories = $derived(
		featuredCategory ? filteredCategories.slice(1) : filteredCategories
	);
</script>

<svelte:head>
	<title>Kategori Layanan - Titipin</title>
	<meta
		name="description"
		content="Jelajahi kategori layanan Titipin: Dititipin, Dianterin, Dibantuin, dan layanan lokal lainnya."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
	<!-- Page Header (No decorative eyebrow pill above H1) -->
	<header
		class="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between"
	>
		<div class="max-w-2xl space-y-2">
			<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Kategori Layanan
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				Pilih jenis bantuan yang Anda butuhkan, mulai dari titip beli di tempat favorit hingga
				pengantaran dan bantuan harian.
			</p>
		</div>

		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<div class="relative w-full sm:w-64">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Cari kategori atau layanan..."
					bind:value={searchQuery}
					class="h-10 pr-8 pl-9 text-xs"
					aria-label="Cari kategori atau layanan"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						aria-label="Hapus pencarian"
						class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
					>
						<X class="size-3.5" />
					</button>
				{/if}
			</div>
			<div
				class="inline-flex h-10 items-center justify-center rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-medium text-muted-foreground tabular-nums"
			>
				{data.categories.length} kategori &middot; {data.totalActiveServices} layanan
			</div>
		</div>
	</header>

	<!-- Categories Directory -->
	{#if data.categories.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
			<p class="text-sm font-semibold text-foreground">Belum ada kategori layanan aktif</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Anda tetap dapat membuat pesanan khusus langsung melalui halaman pemesanan.
			</p>
			<div class="mt-4">
				<Button size="sm" href={resolve('/pesan')}>Buat Pesanan Khusus</Button>
			</div>
		</div>
	{:else if filteredCategories.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
			<p class="text-sm font-semibold text-foreground">
				Tidak ada hasil untuk "{searchQuery}"
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Coba kata kunci lain atau lihat seluruh kategori yang tersedia.
			</p>
			<div class="mt-4">
				<Button variant="outline" size="sm" onclick={() => (searchQuery = '')}>
					Reset Pencarian
				</Button>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Featured Primary Category -->
			{#if featuredCategory}
				{@const FeaturedIcon = getCategoryIcon(featuredCategory.icon, featuredCategory.slug)}
				{@const featuredServices = data.servicesByCategory[featuredCategory.id] ?? []}
				<section
					aria-label={featuredCategory.name}
					class="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 sm:p-7"
				>
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
						<div class="space-y-3 lg:col-span-7">
							<div class="flex items-center gap-3">
								<div
									class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
								>
									<FeaturedIcon class="size-5" />
								</div>
								<div>
									<h2 class="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
										{featuredCategory.name}
									</h2>
									<p class="text-xs font-medium text-muted-foreground tabular-nums">
										{featuredServices.length} layanan tersedia
									</p>
								</div>
							</div>

							<p class="max-w-xl text-sm leading-relaxed text-muted-foreground">
								{featuredCategory.description ||
									'Layanan utama Titipin untuk kebutuhan harian Anda.'}
							</p>

							<div class="pt-1">
								<Button
									href={resolve('/kategori/[slug]', { slug: featuredCategory.slug })}
									size="sm"
								>
									<span>Lihat Layanan {featuredCategory.name}</span>
									<ChevronRight class="size-4" />
								</Button>
							</div>
						</div>

						<div class="lg:col-span-5">
							{#if featuredServices.length > 0}
								<div
									class="divide-y divide-border/70 rounded-xl border border-border/80 bg-muted/25"
								>
									{#each featuredServices.slice(0, 3) as svc (svc.id)}
										<a
											href={resolve('/layanan/[id]', { id: svc.id })}
											class="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors hover:bg-muted/60"
										>
											<span class="truncate font-semibold text-foreground">{svc.title}</span>
											<span class="shrink-0 font-bold text-primary tabular-nums">
												Rp {Number(svc.base_fee).toLocaleString('id-ID')}
											</span>
										</a>
									{/each}
								</div>
							{:else}
								<div
									class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground"
								>
									Belum ada item layanan terdaftar di kategori ini. Anda tetap bisa langsung pesan
									kustom.
								</div>
							{/if}
						</div>
					</div>
				</section>
			{/if}

			<!-- Remaining Categories Grid -->
			{#if secondaryCategories.length > 0}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each secondaryCategories as cat (cat.id)}
						{@const IconComponent = getCategoryIcon(cat.icon, cat.slug)}
						{@const catServices = data.servicesByCategory[cat.id] ?? []}
						<a
							href={resolve('/kategori/[slug]', { slug: cat.slug })}
							class="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<div class="space-y-3">
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3">
										<div
											class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
										>
											<IconComponent class="size-5" />
										</div>
										<div>
											<h2
												class="text-base font-bold text-foreground transition-colors group-hover:text-primary"
											>
												{cat.name}
											</h2>
											<span class="text-xs text-muted-foreground tabular-nums">
												{catServices.length} layanan
											</span>
										</div>
									</div>

									<ChevronRight
										class="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
									/>
								</div>

								<p class="text-xs leading-relaxed text-muted-foreground sm:text-sm">
									{cat.description || 'Layanan lokal terverifikasi sesuai kebutuhan Anda.'}
								</p>

								{#if catServices.length > 0}
									<div class="flex flex-wrap gap-1.5 pt-1">
										{#each catServices.slice(0, 3) as svc (svc.id)}
											<span
												class="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
											>
												{svc.title}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Custom Order Strip -->
	<aside
		class="flex flex-col gap-4 rounded-2xl border border-border/80 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="space-y-1">
			<h2 class="text-sm font-bold text-foreground">Kebutuhan di luar daftar kategori?</h2>
			<p class="text-xs text-muted-foreground">
				Tulis detail tempat atau bantuan yang Anda perlukan langsung pada formulir pesanan.
			</p>
		</div>
		<Button href={resolve('/pesan')} variant="outline" size="sm" class="w-fit shrink-0">
			Buat Pesanan Kustom
		</Button>
	</aside>
</div>
