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
				<span class="block font-bold text-foreground">Mitra Terverifikasi</span>
				<span class="text-[11px] text-muted-foreground">Area jangkauan spesifik lokal</span>
			</div>
		</div>
	</div>

	<!-- Provider Listings Status Card -->
	<Card class="border-border/80 shadow-xs">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-bold">Daftar Mitra Jastip di Kategori Ini</CardTitle>
					<CardDescription class="text-xs">
						Mitra lokal yang siap menerima pesanan untuk {data.category.name}
					</CardDescription>
				</div>
			</div>
		</CardHeader>

		<CardContent>
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center"
			>
				<Users class="size-10 text-primary/60" />
				<h3 class="mt-3 text-sm font-bold text-foreground">Listing Layanan Mitra Segera Hadir</h3>
				<p class="mt-1 max-w-md text-xs text-muted-foreground">
					Struktur data dan navigasi kategori telah siap pada <strong>Phase 3</strong>. Pendaftaran
					layanan oleh mitra dan pemilihan spesifik listing layanan akan diaktifkan pada
					<strong>Phase 4 & 5</strong>.
				</p>
				<div class="mt-5 flex gap-2">
					<Button variant="outline" size="sm" href={resolve('/kategori')} class="text-xs">
						Kembali ke Kategori
					</Button>
					<Button size="sm" href={resolve('/profil')} class="text-xs font-bold">
						Lengkapi Alamat Anda
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
