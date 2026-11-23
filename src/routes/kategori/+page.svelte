<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import {
		Utensils,
		Store,
		Carrot,
		Pill,
		ShoppingBag,
		Truck,
		ArrowRight,
		Compass
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
</script>

<svelte:head>
	<title>Kategori Layanan Jastip & Pengantaran - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8">
	<!-- Hero Header -->
	<div class="space-y-2 border-b border-border/60 pb-6">
		<div
			class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
		>
			<Compass class="size-3.5" />
			<span>Katalog Layanan Terverifikasi</span>
		</div>
		<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
			Pilih Kategori Kebutuhan Anda
		</h1>
		<p class="max-w-2xl text-xs text-muted-foreground sm:text-sm">
			Mitra lokal Titipin siap membantu belanjaan harian, kuliner, pasar tradisional, hingga
			pengantaran barang dengan aman dan transparan.
		</p>
	</div>

	<!-- Categories Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.categories as cat (cat.id)}
			{@const IconComponent = getCategoryIcon(cat.icon)}
			<a
				href={resolve('/kategori/[slug]', { slug: cat.slug })}
				class="group block transition-all focus:outline-none"
			>
				<Card
					class="h-full border-border/80 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/60 group-hover:shadow-md"
				>
					<CardContent class="flex h-full flex-col justify-between p-5">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<div
									class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
								>
									<IconComponent class="size-5" />
								</div>
								<span
									class="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase"
								>
									Tersedia
								</span>
							</div>

							<div>
								<h2
									class="text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base"
								>
									{cat.name}
								</h2>
								<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
									{cat.description ||
										'Layanan jastip lokal terpercaya dan bergaransi struk kasir asli.'}
								</p>
							</div>
						</div>

						<div class="mt-4 flex items-center gap-1 text-xs font-bold text-primary">
							<span>Jelajahi Mitra</span>
							<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-1" />
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}
	</div>
</div>
