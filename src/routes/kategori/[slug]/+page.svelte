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
		ChevronRight,
		MapPin,
		ShieldCheck,
		Clock,
		Receipt,
		Search,
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

	const CategoryIcon = $derived(getCategoryIcon(data.category.icon, data.category.slug));

	const filteredServices = $derived.by(() => {
		const list = data.providerServices ?? [];
		const q = searchQuery.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(s) =>
				s.title.toLowerCase().includes(q) ||
				(s.description ?? '').toLowerCase().includes(q) ||
				s.coverage_area.toLowerCase().includes(q)
		);
	});
</script>

<svelte:head>
	<title>{data.category.name} - Kategori Layanan Titipin</title>
	<meta
		name="description"
		content={data.category.description || `Daftar layanan ${data.category.name} di Titipin.`}
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
	<!-- Breadcrumbs -->
	<nav class="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
		<a href={resolve('/')} class="transition-colors hover:text-foreground">Beranda</a>
		<ChevronRight class="size-3.5" />
		<a href={resolve('/kategori')} class="transition-colors hover:text-foreground">Kategori</a>
		<ChevronRight class="size-3.5" />
		<span class="truncate font-semibold text-foreground">{data.category.name}</span>
	</nav>

	<!-- Category Header (Clean solid surface, no generic gradient or decorative eyebrow) -->
	<header class="rounded-2xl border border-border bg-card p-5 sm:p-7">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-4">
				<div
					class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-14"
				>
					<CategoryIcon class="size-6 sm:size-7" />
				</div>
				<div class="space-y-1.5">
					<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
						{data.category.name}
					</h1>
					<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
						{data.category.description || 'Daftar layanan lokal terverifikasi di Titipin.'}
					</p>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<span
					class="rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground tabular-nums"
				>
					{data.providerServices?.length || 0} layanan
				</span>
				<Button variant="outline" size="sm" href={resolve('/kategori')} class="text-xs">
					Semua Kategori
				</Button>
			</div>
		</div>

		<!-- Single hairline-divided service standard bar (instead of 3 separate cards) -->
		<div
			class="mt-6 grid grid-cols-1 gap-3 border-t border-border/70 pt-5 text-xs sm:grid-cols-3 sm:gap-6"
		>
			<div class="flex items-center gap-2.5">
				<Receipt class="size-4 shrink-0 text-primary" />
				<span class="text-muted-foreground">
					<strong class="font-semibold text-foreground">Sesuai nota:</strong> harga barang mengikuti nota
					asli
				</span>
			</div>
			<div class="flex items-center gap-2.5">
				<Clock class="size-4 shrink-0 text-primary" />
				<span class="text-muted-foreground">
					<strong class="font-semibold text-foreground">Tarif jelas:</strong> estimasi biaya dihitung
					di awal
				</span>
			</div>
			<div class="flex items-center gap-2.5">
				<ShieldCheck class="size-4 shrink-0 text-primary" />
				<span class="text-muted-foreground">
					<strong class="font-semibold text-foreground">Area terverifikasi:</strong> mitra lokal aktif
				</span>
			</div>
		</div>
	</header>

	<!-- Filter Bar (shown when services exist) -->
	{#if (data.providerServices?.length ?? 0) > 0}
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-base font-bold text-foreground sm:text-lg">
				Daftar Layanan {data.category.name}
			</h2>

			<div class="relative w-full sm:w-72">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Cari nama tempat atau area..."
					bind:value={searchQuery}
					class="h-9 pr-8 pl-9 text-xs"
					aria-label="Cari layanan di kategori ini"
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
		</div>
	{/if}

	<!-- Flat Services Directory (No nested cards) -->
	{#if !data.providerServices || data.providerServices.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
			<h2 class="text-base font-bold text-foreground">Belum Ada Layanan di Kategori Ini</h2>
			<p class="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
				Layanan spesifik untuk {data.category.name} sedang disiapkan. Anda tetap dapat membuat pesanan
				langsung dengan menuliskan detail tujuan.
			</p>
			<div class="mt-5 flex flex-wrap justify-center gap-2.5">
				<Button variant="outline" size="sm" href={resolve('/kategori')}>Kembali ke Kategori</Button>
				<Button size="sm" href={resolve('/pesan')}>Buat Pesanan Langsung</Button>
			</div>
		</div>
	{:else if filteredServices.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
			<p class="text-sm font-semibold text-foreground">
				Tidak ditemukan layanan yang cocok dengan "{searchQuery}"
			</p>
			<div class="mt-3">
				<Button variant="outline" size="sm" onclick={() => (searchQuery = '')}>
					Tampilkan Semua ({data.providerServices.length})
				</Button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each filteredServices as s (s.id)}
				<article
					class="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/50"
				>
					<div class="space-y-2.5">
						<div class="flex items-center justify-between gap-2 text-xs">
							<div class="flex items-center gap-1.5 font-medium text-muted-foreground">
								<span class="truncate">{s.provider?.business_name || 'Titipin Langsung'}</span>
								{#if s.provider?.is_verified}
									<ShieldCheck
										class="size-3.5 shrink-0 text-primary"
										aria-label="Mitra terverifikasi"
									/>
								{/if}
							</div>
							<span class="flex items-center gap-1 text-[11px] text-muted-foreground">
								<MapPin class="size-3 shrink-0 text-primary" />
								<span class="max-w-44 truncate">{s.coverage_area}</span>
							</span>
						</div>

						<h3 class="text-base font-bold text-foreground">
							<a
								href={resolve('/layanan/[id]', { id: s.id })}
								class="transition-colors hover:text-primary"
							>
								{s.title}
							</a>
						</h3>

						{#if s.description}
							<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
								{s.description}
							</p>
						{/if}
					</div>

					<div
						class="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-3.5"
					>
						<div>
							<span class="block text-[11px] text-muted-foreground">Tarif dasar</span>
							<span class="text-base font-extrabold text-primary tabular-nums">
								Rp {Number(s.base_fee).toLocaleString('id-ID')}
							</span>
						</div>

						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								href={resolve('/layanan/[id]', { id: s.id })}
								class="text-xs"
							>
								Detail
							</Button>
							<Button
								size="sm"
								href="{resolve('/pesan')}?service_id={s.id}"
								class="text-xs font-semibold"
							>
								Pesan
							</Button>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
