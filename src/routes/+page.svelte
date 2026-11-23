<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Input } from '#lib/components/ui/input/index.js';
	import {
		Search,
		MapPin,
		ShieldCheck,
		Clock,
		Receipt,
		Utensils,
		Store,
		Carrot,
		Pill,
		Truck,
		Sparkles,
		Star,
		ChevronRight,
		ArrowRight,
		HeartHandshake,
		BadgeCheck,
		Users,
		ShoppingBag,
		CheckCircle2,
		XCircle,
		HelpCircle
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedLocation = $state('Gatak');

	const locations = [
		'Gatak (Pusat)',
		'Gawok & Blimbing',
		'Trangsan & Luwang',
		'Mayang & Sanggung',
		'Kartasura & UMS',
		'Baki & Gentan',
		'Sawit & Sekitarnya'
	];

	const categoryIcons: Record<string, typeof Utensils> = {
		utensils: Utensils,
		'food-beverage': Utensils,
		kuliner: Utensils,
		store: Store,
		'grocery-mart': Store,
		swalayan: Store,
		carrot: Carrot,
		'traditional-market': Carrot,
		pasar: Carrot,
		pill: Pill,
		pharmacy: Pill,
		farmasi: Pill,
		truck: Truck,
		'pickup-delivery': Truck,
		kurir: Truck,
		sparkles: Sparkles,
		'custom-request': Sparkles,
		custom: Sparkles
	};

	const defaultCategories = [
		{
			id: 'kuliner',
			slug: 'food-beverage',
			name: 'Kuliner & Warung Hits',
			desc: 'Resto viral tanpa ojol, soto bebek legendaris, dan warung makan malam.',
			examples: 'Soto Bebek Gawok, Bebek Goreng, Mie Ayam Lokal, Angkringan',
			icon: Utensils,
			badge: 'Paling Populer',
			activeMitra: '15 Mitra Siap'
		},
		{
			id: 'pasar',
			slug: 'traditional-market',
			name: 'Pasar Pagi & Sayur Segar',
			desc: 'Belanja bahan segar subuh langsung dari pedagang pasar tradisional.',
			examples: 'Pasar Gawok, sayur bayam, daging ayam, bumbu pawon',
			icon: Carrot,
			badge: 'Subuh - Siang',
			activeMitra: '12 Mitra Siap'
		},
		{
			id: 'swalayan',
			slug: 'grocery-mart',
			name: 'Minimarket & Swalayan',
			desc: 'Kebutuhan rumah mendesak, galon air, popok, atau cemilan.',
			examples: 'Indomaret Gatak, Alfamart Gawok, toko kelontong',
			icon: Store,
			badge: 'Cepat 20 Menit',
			activeMitra: '18 Mitra Siap'
		},
		{
			id: 'farmasi',
			slug: 'pharmacy',
			name: 'Apotek & Kebutuhan Medis',
			desc: 'Obat bebas/resep, vitamin, termometer, dan kebutuhan darurat.',
			examples: 'Apotek Gatak, Kimia Farma Kartasura, apotek terdekat',
			icon: Pill,
			badge: 'Prioritas Cepat',
			activeMitra: '8 Mitra Siap'
		},
		{
			id: 'kurir',
			slug: 'pickup-delivery',
			name: 'Ambil & Antar Dokumen',
			desc: 'Kunci rumah tertinggal, berkas kantor, tugas kampus UMS, barang lokal.',
			examples: 'Laundry selesai, paket lokal, barang tertinggal',
			icon: Truck,
			badge: 'Langsung Antar',
			activeMitra: '20 Mitra Siap'
		},
		{
			id: 'custom',
			slug: 'custom-request',
			name: 'Titip Request Kustom',
			desc: 'Belanja toko spesifik, mebel rotan Trangsan, bibit tanaman, request unik.',
			examples: 'Sentra rotan Trangsan, pakan burung, perlengkapan lokal',
			icon: Sparkles,
			badge: 'Fleksibel',
			activeMitra: '10 Mitra Siap'
		}
	];

	const resolvedCategories = $derived(
		data?.categories && data.categories.length > 0
			? data.categories.map((cat, idx) => ({
					id: cat.id,
					slug: cat.slug,
					name: cat.name,
					desc: cat.description || 'Layanan titip belanja terpercaya.',
					examples: defaultCategories[idx]?.examples || 'Belanja kebutuhan toko lokal',
					icon: categoryIcons[cat.icon || ''] || categoryIcons[cat.slug] || Utensils,
					badge: defaultCategories[idx]?.badge || 'Tersedia',
					activeMitra: defaultCategories[idx]?.activeMitra || 'Mitra Siap'
				}))
			: defaultCategories
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
			number: '01',
			title: 'Tulis Titipan & Lokasi Toko',
			desc: 'Tulis nama warung, pasar, atau toko tujuan lengkap dengan rincian belanjaan dan catatan spesifik Anda.'
		},
		{
			number: '02',
			title: 'Mitra Belanja & Foto Struk',
			desc: 'Mitra membelikan pesanan langsung di lokasi dan wajib mengunggah foto struk kasir asli toko sebagai bukti transaksi.'
		},
		{
			number: '03',
			title: 'Diantar Langsung & Bayar Transparan',
			desc: 'Barang diantar ke alamat Anda. Anda membayar harga asli sesuai struk toko ditambah tarif jasa titip yang disepakati.'
		}
	];

	const comparisons = [
		{
			feature: 'Pilihan Tempat Belanja',
			titipin: 'Bebas titip ke warung gang, pasar subuh, hingga toko non-rekanan',
			competitor: 'Terbatas hanya restoran & toko yang terdaftar di aplikasi'
		},
		{
			feature: 'Harga Barang / Menu',
			titipin: '100% harga asli toko fisik sesuai struk kasir',
			competitor: 'Sering di-markup 20% hingga 35% dari harga kasir asli'
		},
		{
			feature: 'Struktur Biaya',
			titipin: 'Tarif jasa titip flat transparan, disepakati di awal',
			competitor: 'Ongkir dinamis + biaya layanan + biaya platform + kemasan'
		},
		{
			feature: 'Bukti Pembelian',
			titipin: 'Wajib lampirkan foto struk kasir toko fisik',
			competitor: 'Tanpa struk fisik toko'
		}
	];

	const testimonials = [
		{
			quote:
				'Akhirnya bisa titip Soto Bebek Gawok pas jam kerja di rumah tanpa harus antre di warung. Harganya persis nota kasir warung.',
			author: 'Agus Santoso',
			role: 'Wiraswasta',
			location: 'Gawok, Gatak'
		},
		{
			quote:
				'Belanja sayuran subuh di Pasar Gawok jadi gampang. Catatan belanjaan dibeliin lengkap dan langsung diantar ke dapur.',
			author: 'Tri Handayani',
			role: 'Ibu Rumah Tangga',
			location: 'Trangsan, Gatak'
		},
		{
			quote:
				'Buku catatan ketinggalan di kampus UMS langsung dijemput dan diantar ke kosan di Mayang dalam 25 menit. Tarifnya pas di kantong mahasiswa.',
			author: 'Rifki Pratama',
			role: 'Mahasiswa UMS',
			location: 'Mayang, Gatak'
		}
	];
</script>

<div class="space-y-16 sm:space-y-24">
	<!-- Hero Section -->
	<section class="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-primary/5 via-background to-background pt-10 pb-16 sm:pt-16 sm:pb-24">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
				<!-- Hero Copy -->
				<div class="space-y-6 lg:col-span-7">
					<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
						<Sparkles class="size-3.5" />
						<span>Jasa Titip Belanja Lokal & Pengantaran Cepat</span>
					</div>

					<h1 class="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
						Belanja dari toko mana saja, diantar langsung oleh tetangga.
					</h1>

					<p class="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						Titip makanan warung kaki lima, sayur segar pasar tradisional, swalayan, hingga apotek darurat. Harga barang murni sesuai struk kasir toko asli tanpa markup tersembunyi.
					</p>

					<!-- Location Selector & Search Bar -->
					<div class="rounded-2xl border border-border/80 bg-card p-2.5 shadow-md sm:p-3">
						<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
							<div class="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs font-medium sm:w-48">
								<MapPin class="size-4 shrink-0 text-primary" />
								<select
									bind:value={selectedLocation}
									class="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-hidden"
								>
									{#each locations as loc}
										<option value={loc}>{loc}</option>
									{/each}
								</select>
							</div>

							<div class="relative flex-1">
								<Search class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
								<Input
									type="text"
									bind:value={searchQuery}
									placeholder="Mau titip apa hari ini? (misal: martabak, obat, sayur...)"
									class="h-10 border-border/70 pl-9 text-xs sm:text-sm"
								/>
							</div>

							<a
								href="#eksplor"
								class="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-xs transition-transform hover:bg-primary/95 active:scale-98"
							>
								<span>Cari Kategori</span>
							</a>
						</div>
					</div>

					<!-- Key Metrics -->
					<div class="grid grid-cols-3 gap-4 border-t border-border/70 pt-6">
						<div>
							<p class="text-xl font-black text-foreground sm:text-2xl">100%</p>
							<p class="mt-0.5 text-xs text-muted-foreground">Struk Toko Asli</p>
						</div>
						<div>
							<p class="text-xl font-black text-foreground sm:text-2xl">Rp 0</p>
							<p class="mt-0.5 text-xs text-muted-foreground">Markup Harga Menu</p>
						</div>
						<div>
							<p class="text-xl font-black text-foreground sm:text-2xl">Gatak & Sekitar</p>
							<p class="mt-0.5 text-xs text-muted-foreground">Area Operasional</p>
						</div>
					</div>
				</div>

				<!-- Hero Visual Product Truth Card -->
				<div class="lg:col-span-5">
					<div class="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xl">
						<div class="flex items-center justify-between border-b border-border/60 pb-3">
							<div class="flex items-center gap-2">
								<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Receipt class="size-4" />
								</div>
								<div>
									<p class="text-xs font-bold text-foreground">Struk Kasir Toko Asli</p>
									<p class="text-[10px] text-muted-foreground">ID Titipan #TT-84920</p>
								</div>
							</div>
							<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
								<CheckCircle2 class="size-3" />
								<span>Terverifikasi</span>
							</span>
						</div>

						<div class="mt-4 space-y-3">
							<div class="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
								<p class="font-bold text-foreground">Soto Bebek Gawok Spesial</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground">2x Soto Bebek Kuah Segar + 2x Es Teh</p>
								<div class="mt-2 flex justify-between border-t border-border/50 pt-2 font-semibold">
									<span>Harga Struk Toko</span>
									<span class="text-foreground">Rp 36.000</span>
								</div>
							</div>

							<div class="space-y-1.5 text-xs text-muted-foreground">
								<div class="flex justify-between">
									<span>Tarif Jastip Mitra Lokal</span>
									<span class="font-medium text-foreground">Rp 8.000</span>
								</div>
								<div class="flex justify-between">
									<span>Biaya Layanan Aplikasi</span>
									<span class="font-medium text-foreground">Rp 1.000</span>
								</div>
								<div class="flex justify-between border-t border-border/60 pt-2 text-sm font-black text-foreground">
									<span>Total Transparan</span>
									<span class="text-primary">Rp 45.000</span>
								</div>
							</div>

							<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-700">
								<div class="flex items-center gap-2">
									<ShieldCheck class="size-4 shrink-0 text-emerald-600" />
									<span class="font-semibold">Foto bukti struk kasir toko fisik terlampir di aplikasi</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories Grid Section -->
	<section id="eksplor" class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end">
			<div>
				<div class="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase">
					<span>Katalog Layanan</span>
				</div>
				<h2 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Kategori Layanan Populer
				</h2>
				<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
					Pilih kategori belanjaan yang ingin Anda titipkan ke mitra terdekat di {selectedLocation}.
				</p>
			</div>
			<a
				href={resolve('/daftar')}
				class="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:underline"
			>
				<span>Lihat Semua Layanan</span>
				<ChevronRight class="size-4" />
			</a>
		</div>

		<div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredCategories as category}
				{@const IconComponent = category.icon}
				<a
					href={resolve('/kategori/[slug]', { slug: category.slug })}
					class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
				>
					<div>
						<div class="flex items-center justify-between">
							<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
								<IconComponent class="size-5" />
							</div>
							<span class="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
								{category.badge}
							</span>
						</div>

						<h3 class="mt-4 text-base font-bold text-foreground transition-colors group-hover:text-primary">
							{category.name}
						</h3>
						<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
							{category.desc}
						</p>

						<div class="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
							<span class="font-semibold text-foreground">Contoh:</span> {category.examples}
						</div>
					</div>

					<div class="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
						<span class="text-[11px] font-medium text-emerald-600">{category.activeMitra}</span>
						<span class="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
							<span>Pesan Jastip</span>
							<ArrowRight class="size-3.5" />
						</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- How It Works Section -->
	<section id="carakerja" class="border-y border-border/60 bg-muted/30 py-16 sm:py-20">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="text-center">
				<span class="text-xs font-bold text-primary uppercase">Alur Transaksi</span>
				<h2 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Cara Kerja Titipin
				</h2>
				<p class="mx-auto mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
					Tiga langkah sederhana dari membuat pesanan titip hingga barang tiba di tangan Anda dengan struk kasir asli.
				</p>
			</div>

			<div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
				{#each steps as step}
					<div class="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
						<span class="text-3xl font-black text-primary/30">{step.number}</span>
						<h3 class="mt-3 text-base font-bold text-foreground">{step.title}</h3>
						<p class="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Comparison Section: Titipin vs Aplikasi Lain -->
	<section id="keunggulan" class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="text-center">
			<span class="text-xs font-bold text-primary uppercase">Transparansi Nyata</span>
			<h2 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Mengapa Memilih Titipin?
			</h2>
			<p class="mx-auto mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
				Perbandingan jujur antara memesan lewat Titipin dan aplikasi pesan antar konvensional.
			</p>
		</div>

		<div class="mt-10 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
			<div class="grid grid-cols-12 border-b border-border/80 bg-muted/50 p-4 text-xs font-bold sm:p-5">
				<div class="col-span-4 text-foreground">Fitur & Layanan</div>
				<div class="col-span-4 text-primary">Titipin</div>
				<div class="col-span-4 text-muted-foreground">Aplikasi Lain</div>
			</div>

			<div class="divide-y divide-border/60">
				{#each comparisons as comp}
					<div class="grid grid-cols-12 items-center p-4 text-xs sm:p-5">
						<div class="col-span-4 font-semibold text-foreground">{comp.feature}</div>
						<div class="col-span-4 pr-3 font-medium text-emerald-700">
							<div class="flex items-start gap-1.5">
								<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
								<span>{comp.titipin}</span>
							</div>
						</div>
						<div class="col-span-4 pr-3 text-muted-foreground">
							<div class="flex items-start gap-1.5">
								<XCircle class="mt-0.5 size-3.5 shrink-0 text-destructive/70" />
								<span>{comp.competitor}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="text-center">
				<span class="text-xs font-bold text-primary uppercase">Pengalaman Pengguna</span>
				<h2 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Cerita Nyata Pengguna Titipin
				</h2>
			</div>

			<div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
				{#each testimonials as test}
					<div class="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
						<p class="text-xs leading-relaxed text-muted-foreground italic">
							"{test.quote}"
						</p>
						<div class="mt-6 border-t border-border/60 pt-4">
							<p class="text-xs font-bold text-foreground">{test.author}</p>
							<p class="text-[11px] text-muted-foreground">{test.role} &bull; {test.location}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Closing CTA Banner -->
	<section id="bantuan" class="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
		<div class="overflow-hidden rounded-3xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-2xl font-black tracking-tight text-white sm:text-3xl">
					Siap titip belanjaan pertama Anda tanpa ribet?
				</h2>
				<p class="mt-3 text-xs leading-relaxed text-primary-foreground/90 sm:text-sm">
					Daftarkan akun gratis sekarang. Titip kebutuhan warung, pasar, atau minimarket ke tetangga dengan struk kasir asli.
				</p>
				<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<a
						href={resolve('/daftar')}
						class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white px-6 text-xs font-bold text-primary shadow-xs transition-transform hover:bg-white/95 active:scale-98 sm:w-auto"
					>
						<span>Daftar Akun Gratis</span>
						<ArrowRight class="ml-1.5 size-4" />
					</a>
					<a
						href="#eksplor"
						class="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 sm:w-auto"
					>
						<span>Lihat Kategori Layanan</span>
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
