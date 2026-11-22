<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { MapPin, ShieldCheck, Clock, ShoppingCart } from 'lucide-svelte';

	const categories = [
		{ name: 'Kuliner & Makanan', desc: 'Jastip resto & cafe' },
		{ name: 'Minimarket & Swalayan', desc: 'Kebutuhan harian' },
		{ name: 'Pasar Tradisional', desc: 'Bahan segar & sayur' },
		{ name: 'Mall Shopping', desc: 'Toko ritel & brand' },
		{ name: 'Kebutuhan Khusus', desc: 'Request kustom' },
		{ name: 'Ambil & Antar', desc: 'Dokumen & paket lokal' }
	];
</script>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
	<!-- Hero Section Placeholder -->
	<section
		class="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-linear-to-br from-primary/5 via-card to-background p-6 text-center shadow-sm sm:p-10 sm:text-left md:flex-row"
	>
		<div class="max-w-xl space-y-3">
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
			>
				<ShieldCheck class="size-3.5" />
				<span>Pilot Lokal Terbatas</span>
			</div>
			<h1 class="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
				Titip Belanja & Kirim Barang Jadi Lebih Praktis
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
				Hubungkan kebutuhan titip belanja atau pickup pengantaran Anda langsung dengan penyedia jasa
				terpercaya di area lokal.
			</p>
			<div class="flex flex-wrap items-center justify-center gap-3 pt-2 sm:justify-start">
				<Button size="lg" class="shadow-sm">Mulai Cari Layanan</Button>
				<Button variant="outline" size="lg">Pelajari Alur Kerja</Button>
			</div>
		</div>

		<!-- Info card placeholder -->
		<div
			class="w-full space-y-3 rounded-xl border border-border/80 bg-card p-5 text-left shadow-sm md:w-80"
		>
			<div class="flex items-center gap-2 text-sm font-semibold text-primary">
				<MapPin class="size-4" />
				<span>Wilayah Layanan Pilot</span>
			</div>
			<p class="text-xs text-muted-foreground">
				Fase 1: App Shell aktif. Fitur autentikasi dan katalog layanan akan diaktifkan pada fase
				berikutnya.
			</p>
			<div class="grid grid-cols-2 gap-2 pt-2 text-xs">
				<div class="rounded-lg bg-muted/60 p-2.5 text-center">
					<span class="block font-semibold text-foreground">Order Langsung</span>
					<span class="text-[11px] text-muted-foreground">Ke Mitra Pilihan</span>
				</div>
				<div class="rounded-lg bg-muted/60 p-2.5 text-center">
					<span class="block font-semibold text-foreground">Transparan</span>
					<span class="text-[11px] text-muted-foreground">Rincian Biaya Pasti</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Quick Categories Placeholder -->
	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">
					Kategori Layanan
				</h2>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Daftar layanan yang akan tersedia di Titipin
				</p>
			</div>
			<span class="text-xs text-muted-foreground italic">Placeholder Phase 1</span>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
			{#each categories as cat (cat.name)}
				<div
					class="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm"
				>
					<div
						class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
					>
						<ShoppingCart class="size-4.5" />
					</div>
					<div>
						<h3 class="text-xs font-semibold text-foreground sm:text-sm">{cat.name}</h3>
						<p class="mt-0.5 text-[11px] text-muted-foreground">{cat.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Project Foundation Status Note -->
	<section
		class="flex items-start gap-3.5 rounded-xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground sm:p-5"
	>
		<Clock class="mt-0.5 size-5 shrink-0 text-primary" />
		<div class="space-y-1">
			<p class="font-semibold text-foreground">Status Fondasi Sistem (Phase 1):</p>
			<p>
				SvelteKit 2 + Svelte 5 + Tailwind CSS v4 + shadcn-svelte berhasil di-scaffold. Struktur
				direktori, utilitas styling <code
					class="rounded bg-muted px-1 py-0.5 text-[11px] text-foreground"
				>
					cn
				</code>, dan responsive shell sudah siap untuk integrasi Supabase Auth & Roles pada Phase 2.
			</p>
		</div>
	</section>
</div>
