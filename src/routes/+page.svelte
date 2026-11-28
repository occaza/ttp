<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Select } from '#lib/components/ui/select/index.js';
	import {
		ArrowRight,
		Carrot,
		CheckCircle2,
		ChevronRight,
		HandHelping,
		MapPin,
		Pill,
		Receipt,
		Search,
		ShieldCheck,
		ShoppingBag,
		Sparkles,
		Store,
		Truck,
		Utensils,
		Wrench,
		XCircle
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedLocation = $state('Gatak (Pusat)');

	const locations = [
		'Gatak (Pusat)',
		'Gawok & Blimbing',
		'Trangsan & Luwang',
		'Mayang & Sanggung',
		'Kartasura & UMS',
		'Baki & Gentan',
		'Sawit & Sekitarnya'
	];

	const locationOptions = locations.map((loc) => ({ value: loc, label: loc }));

	const categoryIcons: Record<string, typeof ShoppingBag> = {
		'shopping-bag': ShoppingBag,
		dititipin: ShoppingBag,
		truck: Truck,
		dianterin: Truck,
		'pickup-delivery': Truck,
		'hand-helping': HandHelping,
		dibantuin: HandHelping,
		wrench: Wrench,
		utensils: Utensils,
		'food-beverage': Utensils,
		store: Store,
		'grocery-mart': Store,
		carrot: Carrot,
		'traditional-market': Carrot,
		pill: Pill,
		pharmacy: Pill,
		sparkles: Sparkles,
		'custom-request': Sparkles
	};

	const resolvedCategories = $derived(
		(data?.categories ?? []).map((cat) => ({
			id: cat.id,
			slug: cat.slug,
			name: cat.name,
			desc: cat.description || 'Layanan lokal sesuai kebutuhan Anda.',
			examples: (data?.serviceExamplesByCategory?.[cat.id] ?? []).join(', '),
			icon: categoryIcons[cat.icon || ''] || categoryIcons[cat.slug] || ShoppingBag
		}))
	);

	const filteredCategories = $derived(
		searchQuery.trim()
			? resolvedCategories.filter(
					(cat) =>
						cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						cat.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
						cat.examples.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: resolvedCategories
	);

	const steps = [
		{
			step: 'Langkah 1',
			title: 'Tulis daftar belanja dan nama toko',
			desc: 'Isi nama warung, pasar, atau toko tujuan beserta daftar barang dan catatan khusus.'
		},
		{
			step: 'Langkah 2',
			title: 'Dibelikan langsung di toko tujuan',
			desc: 'Tim Titipin membeli pesanan di lokasi dan melampirkan foto nota belanja.'
		},
		{
			step: 'Langkah 3',
			title: 'Diantar ke alamat Anda',
			desc: 'Bayar total belanja sesuai nota toko ditambah tarif jasa titip yang disepakati di awal.'
		}
	];

	const comparisons = [
		{
			feature: 'Pilihan tempat belanja',
			titipin: 'Warung gang, pasar tradisional, hingga toko non-rekanan',
			other: 'Hanya toko atau restoran yang terdaftar di aplikasi'
		},
		{
			feature: 'Harga barang',
			titipin: 'Mengikuti harga di toko tujuan',
			other: 'Umumnya lebih tinggi dari harga makan di tempat'
		},
		{
			feature: 'Rincian biaya jasa',
			titipin: 'Tarif jasa titip flat, tampil jelas sebelum konfirmasi',
			other: 'Gabungan ongkir, biaya layanan, dan biaya tambahan lain'
		},
		{
			feature: 'Bukti pembelian',
			titipin: 'Foto nota belanja dilampirkan di detail pesanan',
			other: 'Menggunakan ringkasan digital aplikasi'
		}
	];
</script>

<svelte:head>
	<title>Titipin — Titip Belanja Lokal Gatak &amp; Kartasura</title>
</svelte:head>

<div class="space-y-16 sm:space-y-24">
	<!-- Hero -->
	<section
		class="border-b border-border/60 bg-linear-to-b from-primary/5 via-background to-background pt-8 pb-14 sm:pt-14 sm:pb-20"
	>
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
				<div class="space-y-6 lg:col-span-7">
					<h1
						class="text-3xl font-black tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
					>
						Titip belanja dari toko mana saja di sekitar Gatak.
					</h1>

					<p class="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						Layanan titip belanja dan antar-jemput lokal di area Gatak, Gawok, hingga Kartasura.
						Harga barang mengikuti nota toko, terpisah dari tarif jasa titip.
					</p>

					<!-- Location & Search Form -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							const params = new SvelteURLSearchParams();
							if (searchQuery.trim()) params.set('q', searchQuery.trim());
							if (selectedLocation) params.set('area', selectedLocation);
							const qs = params.toString();
							// eslint-disable-next-line svelte/no-navigation-without-resolve
							void goto(qs ? `${resolve('/layanan')}?${qs}` : resolve('/layanan'));
						}}
						class="rounded-2xl border border-border/80 bg-card p-2.5 shadow-sm sm:p-3"
					>
						<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
							<label class="sr-only" for="hero-area">Pilih area pengantaran</label>
							<div
								class="flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-1 sm:w-52"
							>
								<MapPin class="size-4 shrink-0 text-primary" />
								<Select
									id="hero-area"
									bind:value={selectedLocation}
									options={locationOptions}
									triggerClass="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
								/>
							</div>

							<div class="relative flex-1">
								<label class="sr-only" for="hero-search">Cari barang atau layanan</label>
								<Search
									class="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground sm:top-3"
								/>
								<Input
									id="hero-search"
									type="text"
									bind:value={searchQuery}
									placeholder="Mau titip apa? (soto, sayur, obat...)"
									class="h-11 border-border/70 pl-9 text-base sm:h-10 sm:text-sm"
								/>
							</div>

							<button
								type="submit"
								class="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:h-10 sm:text-xs"
							>
								<span>Cari Layanan</span>
							</button>
						</div>
					</form>

					<!-- Direct CTA + Key Commitments -->
					<div class="flex flex-wrap items-center gap-4 pt-1">
						<a
							href={resolve('/pesan')}
							class="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
						>
							<span>Buat Pesanan Langsung</span>
							<ArrowRight class="size-4" />
						</a>
						<span class="text-xs text-muted-foreground">
							Bayar sesuai nota toko &middot; Tarif flat mulai Rp 8.000
						</span>
					</div>
				</div>

				<!-- Synthetic Receipt Example -->
				<div class="lg:col-span-5">
					<div
						class="mx-auto max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-lg sm:p-6"
					>
						<div class="flex items-center justify-between border-b border-border/60 pb-3">
							<div class="flex items-center gap-2.5">
								<div
									class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
								>
									<Receipt class="size-4" />
								</div>
								<div>
									<p class="text-xs font-bold text-foreground">Contoh Rincian Nota</p>
									<p class="text-[11px] text-muted-foreground">Simulasi pesanan #TP-84920</p>
								</div>
							</div>
							<span
								class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
							>
								<CheckCircle2 class="size-3" />
								<span>Foto Nota</span>
							</span>
						</div>

						<div class="mt-4 space-y-3">
							<div class="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
								<p class="font-bold text-foreground">Soto Bebek Gawok</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground">
									2 porsi Soto Bebek + 2 Es Teh
								</p>
								<div class="mt-2 flex justify-between border-t border-border/50 pt-2 font-semibold">
									<span>Harga Nota Toko</span>
									<span class="text-foreground tabular-nums">Rp 36.000</span>
								</div>
							</div>

							<div class="space-y-1.5 text-xs text-muted-foreground">
								<div class="flex justify-between">
									<span>Tarif Flat Jastip</span>
									<span class="font-medium text-foreground tabular-nums">Rp 8.000</span>
								</div>
								<div class="flex justify-between">
									<span>Biaya Aplikasi</span>
									<span class="font-medium text-foreground tabular-nums">Rp 1.000</span>
								</div>
								<div
									class="flex justify-between border-t border-border/60 pt-2 text-sm font-black text-foreground"
								>
									<span>Total Dibayar</span>
									<span class="text-primary tabular-nums">Rp 45.000</span>
								</div>
							</div>

							<div
								class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] font-medium text-emerald-800 dark:text-emerald-300"
							>
								<ShieldCheck class="size-4 shrink-0 text-emerald-600" />
								<span>Foto nota belanja dikirim di halaman detail pesanan.</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories -->
	<section id="eksplor" class="mx-auto max-w-6xl px-4 sm:px-6">
		<div
			class="flex flex-col items-start justify-between gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end"
		>
			<div>
				<h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Kategori Titipan
				</h2>
				<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
					Pilih jenis belanjaan untuk area {selectedLocation}.
				</p>
			</div>
			<a
				href={resolve('/layanan')}
				class="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-primary hover:underline"
			>
				<span>Lihat Semua Layanan</span>
				<ChevronRight class="size-4" />
			</a>
		</div>

		{#if filteredCategories.length === 0}
			<div
				class="mt-6 rounded-2xl border border-border/80 bg-card p-8 text-center text-xs text-muted-foreground"
			>
				Tidak ada kategori yang cocok dengan "{searchQuery}". Coba kata kunci lain atau
				<a href={resolve('/pesan')} class="font-semibold text-primary underline">
					buat pesanan kustom
				</a>.
			</div>
		{:else}
			<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredCategories as category (category.id)}
					{@const IconComponent = category.icon}
					<a
						href={resolve('/kategori/[slug]', { slug: category.slug })}
						class="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/20"
					>
						<div>
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
							>
								<IconComponent class="size-5" />
							</div>

							<h3 class="mt-4 text-base font-bold text-foreground group-hover:text-primary">
								{category.name}
							</h3>
							<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
								{category.desc}
							</p>
							{#if category.examples}
								<p
									class="mt-3 rounded-lg bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground"
								>
									<span class="font-semibold text-foreground">Contoh:</span>
									{category.examples}
								</p>
							{/if}
						</div>

						<div
							class="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-primary"
						>
							<span>Pilih Kategori</span>
							<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<!-- How It Works -->
	<section id="carakerja" class="border-y border-border/60 bg-muted/30 py-14 sm:py-18">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="max-w-xl">
				<h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Cara Kerja Titipin
				</h2>
				<p class="mt-1.5 text-xs text-muted-foreground sm:text-sm">
					Tiga langkah dari menulis daftar titipan hingga barang diterima di rumah.
				</p>
			</div>

			<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
				{#each steps as item (item.step)}
					<div class="rounded-2xl border border-border/80 bg-card p-5">
						<p class="text-xs font-bold text-primary">{item.step}</p>
						<h3 class="mt-2 text-base font-bold text-foreground">{item.title}</h3>
						<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Transparent Comparison -->
	<section id="keunggulan" class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="max-w-xl">
			<h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Perbedaan Belanja Lewat Titipin
			</h2>
			<p class="mt-1.5 text-xs text-muted-foreground sm:text-sm">
				Perbandingan skema biaya dan pilihan toko dibanding aplikasi pesan antar biasa.
			</p>
		</div>

		<div class="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-card">
			<div
				class="hidden grid-cols-12 border-b border-border/80 bg-muted/50 px-5 py-3.5 text-xs font-bold sm:grid"
			>
				<div class="col-span-4 text-foreground">Aspek</div>
				<div class="col-span-4 text-primary">Titipin</div>
				<div class="col-span-4 text-muted-foreground">Aplikasi Pesan Antar Biasa</div>
			</div>

			<div class="divide-y divide-border/60">
				{#each comparisons as comp (comp.feature)}
					<div class="grid grid-cols-1 gap-2.5 p-4 text-xs sm:grid-cols-12 sm:items-center sm:p-5">
						<div class="font-bold text-foreground sm:col-span-4">{comp.feature}</div>
						<div
							class="flex items-start gap-2 font-medium text-emerald-700 sm:col-span-4 sm:pr-3 dark:text-emerald-300"
						>
							<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
							<span>{comp.titipin}</span>
						</div>
						<div class="flex items-start gap-2 text-muted-foreground sm:col-span-4 sm:pr-3">
							<XCircle class="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
							<span>{comp.other}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Closing CTA -->
	<section id="bantuan" class="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
		<div
			class="flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-10"
		>
			<div class="max-w-xl">
				<h2 class="text-xl font-black tracking-tight text-white sm:text-2xl">
					Perlu titip belanja hari ini di area Gatak dan sekitarnya?
				</h2>
				<p class="mt-2 text-xs leading-relaxed text-primary-foreground/90 sm:text-sm">
					{#if data?.user}
						Kirim daftar belanja, pantau progres pesanan, dan lihat rincian nota pembelian langsung
						dari akun Anda.
					{:else}
						Buat akun gratis untuk mengirim daftar belanja, memantau progres pesanan, dan melihat
						rincian nota pembelian.
					{/if}
				</p>
			</div>

			<div class="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row">
				{#if data?.user}
					<a
						href={resolve('/pesan')}
						class="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-xs font-bold text-primary transition-colors hover:bg-white/95"
					>
						<span>Buat Pesanan</span>
						<ArrowRight class="size-4" />
					</a>
					<a
						href={resolve('/pesanan')}
						class="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
					>
						<span>Pesanan Saya</span>
					</a>
				{:else}
					<a
						href={resolve('/daftar')}
						class="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-xs font-bold text-primary transition-colors hover:bg-white/95"
					>
						<span>Daftar Akun</span>
						<ArrowRight class="size-4" />
					</a>
					<a
						href={resolve('/pesan')}
						class="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
					>
						<span>Buat Pesanan</span>
					</a>
				{/if}
			</div>
		</div>
	</section>
</div>
