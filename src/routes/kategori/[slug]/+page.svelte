<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.js';
	import {
		Utensils,
		Store,
		Carrot,
		Pill,
		ShoppingBag,
		Truck,
		ChevronRight,
		Users,
		ShieldCheck,
		Clock,
		Receipt
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	function getCategoryIcon(iconName: string) {
		switch (iconName) {
			case 'utensils':
				return Utensils;
			case 'store':
				return Store;
			case 'carrot':
				return Carrot;
			case 'pill':
				return Pill;
			case 'truck':
				return Truck;
			default:
				return ShoppingBag;
		}
	}

	const CategoryIcon = $derived(getCategoryIcon(data.category.icon));
</script>

<svelte:head>
	<title>{data.category.name} - Kategori Layanan Titipin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Breadcrumbs -->
	<nav class="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
		<a href={resolve('/')} class="hover:text-foreground">Beranda</a>
		<ChevronRight class="size-3.5" />
		<a href={resolve('/kategori')} class="hover:text-foreground">Kategori</a>
		<ChevronRight class="size-3.5" />
		<span class="truncate font-semibold text-foreground">{data.category.name}</span>
	</nav>

	<!-- Category Header Banner -->
	<div
		class="rounded-2xl border border-border/80 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<div
					class="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
				>
					<CategoryIcon class="size-7" />
				</div>
				<div>
					<h1 class="text-xl font-black tracking-tight text-foreground sm:text-2xl">
						{data.category.name}
					</h1>
					<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
						{data.category.description || 'Layanan jastip lokal terpercaya dan transparan.'}
					</p>
				</div>
			</div>

			<Button variant="outline" size="sm" href={resolve('/kategori')} class="w-fit text-xs">
				Lihat Semua Kategori
			</Button>
		</div>
	</div>

	<!-- Information Cards for Category Standard -->
	<div class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
		<div
			class="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs"
		>
			<Receipt class="size-4 shrink-0 text-primary" />
			<div>
				<span class="block font-bold text-foreground">Struk Kasir Asli</span>
				<span class="text-[11px] text-muted-foreground">Harga belanjaan sesuai bukti fisik</span>
			</div>
		</div>

		<div
			class="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs"
		>
			<Clock class="size-4 shrink-0 text-primary" />
			<div>
				<span class="block font-bold text-foreground">Estimasi Transparan</span>
				<span class="text-[11px] text-muted-foreground">Tarif jasa dan jarak dihitung di awal</span>
			</div>
		</div>

		<div
			class="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs"
		>
			<ShieldCheck class="size-4 shrink-0 text-primary" />
			<div>
				<span class="block font-bold text-foreground">Layanan Terverifikasi</span>
				<span class="text-[11px] text-muted-foreground">Area jangkauan spesifik lokal</span>
			</div>
		</div>
	</div>

	<!-- Provider Listings Section -->
	<Card class="border-border/80 shadow-xs">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-bold">Pilihan Layanan Jastip di Kategori Ini</CardTitle>
					<CardDescription class="text-xs">
						Layanan belanja langsung {data.category.name} di area Gatak dan sekitarnya
					</CardDescription>
				</div>
				<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
					{data.providerServices?.length || 0} Layanan Tersedia
				</span>
			</div>
		</CardHeader>

		<CardContent>
			{#if !data.providerServices || data.providerServices.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center"
				>
					<Users class="size-10 text-primary/60" />
					<h3 class="mt-3 text-sm font-bold text-foreground">Belum Ada Layanan di Kategori Ini</h3>
					<p class="mt-1 max-w-md text-xs text-muted-foreground">
						Layanan untuk kategori ini sedang disiapkan. Anda tetap dapat melakukan request titip
						langsung via WhatsApp.
					</p>
					<div class="mt-5 flex gap-2">
						<Button variant="outline" size="sm" href={resolve('/kategori')} class="text-xs">
							Kembali ke Kategori
						</Button>
						<Button size="sm" href={resolve('/daftar')} class="text-xs font-bold">
							Mulai Request Titipan
						</Button>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each data.providerServices as s (s.id)}
						<div
							class="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4.5 shadow-2xs transition-all hover:border-primary/50"
						>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1.5">
										<span class="text-xs font-bold text-foreground">
											{s.provider?.business_name || 'Titipin Langsung'}
										</span>
										{#if s.provider?.is_verified}
											<ShieldCheck class="size-3.5 text-primary" />
										{/if}
									</div>
									<span
										class="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"
									>
										Buka Pesanan
									</span>
								</div>

								<h4 class="text-sm font-bold text-foreground">{s.title}</h4>

								{#if s.description}
									<p class="text-xs leading-relaxed text-muted-foreground">
										{s.description}
									</p>
								{/if}

								<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<Clock class="size-3 text-primary" />
									<span>Area: {s.coverage_area}</span>
								</div>
							</div>

							<div class="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
								<div>
									<span class="block text-[10px] text-muted-foreground">Tarif Dasar Jastip</span>
									<span class="text-sm font-black text-primary">
										Rp {Number(s.base_fee).toLocaleString('id-ID')}
									</span>
								</div>

								<Button size="sm" class="h-8 gap-1 text-xs font-bold" href={resolve('/daftar')}>
									<span>Pesan Jastip</span>
									<ChevronRight class="size-3.5" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
