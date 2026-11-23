<script lang="ts">
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
		ShoppingBag
	} from 'lucide-svelte';

	let searchQuery = $state('');
	let selectedLocation = $state('Jakarta Selatan');

	const getStars = (count: number) => Array.from({ length: count }, (_, i) => i);

	const locations = [
		'Jakarta Selatan',
		'Jakarta Pusat',
		'Jakarta Barat',
		'Jakarta Timur',
		'Tangerang Selatan',
		'Depok',
		'Bekasi'
	];

	const categories = [
		{
			id: 'kuliner',
			name: 'Kuliner & Warung Hits',
			desc: 'Resto viral tanpa ojol, kedai kopi legendaris, & jajanan malam.',
			examples: 'Gultik Blok M, Martabak San Fransisco, Warteg Warmo',
			icon: Utensils,
			badge: 'Paling Populer',
			activeMitra: '42 Mitra Online'
		},
		{
			id: 'pasar',
			name: 'Pasar Pagi & Sayur Segar',
			desc: 'Belanja bahan segar subuh langsung dari pedagang pasar lokal.',
			examples: 'Sayur bayam, daging segar, ayam potong, bumbu rempah',
			icon: Carrot,
			badge: 'Subuh - Siang',
			activeMitra: '28 Mitra Online'
		},
		{
			id: 'swalayan',
			name: 'Minimarket & Swalayan',
			desc: 'Kebutuhan rumah mendesak, air galon, popok, atau cemilan.',
			examples: 'Indomaret, Alfamart, Superindo, minimarket lokal',
			icon: Store,
			badge: 'Cepat 20 Menit',
			activeMitra: '35 Mitra Online'
		},
		{
			id: 'farmasi',
			name: 'Apotek & Kebutuhan Medis',
			desc: 'Obat resep/bebas, vitamin, termometer, & kebutuhan darurat 24 jam.',
			examples: 'Apotek K-24, Kimia Farma, Century, Apotek Berkat',
			icon: Pill,
			badge: 'Prioritas Cepat',
			activeMitra: '19 Mitra Online'
		},
		{
			id: 'kurir',
			name: 'Ambil & Antar Dokumen',
			desc: 'Kunci rumah tertinggal, berkas kantor, charger laptop, paket lokal.',
			examples: 'Dokumen kantor, laundry selesai, barang tertinggal di kafe',
			icon: Truck,
			badge: 'Langsung Antar',
			activeMitra: '50 Mitra Online'
		},
		{
			id: 'custom',
			name: 'Titip Request Kustom',
			desc: 'Antrean tiket, belanja toko spesifik, florist, atau titip khusus.',
			examples: 'Toko hobi, bunga ucapan, merchandise event, request unik',
			icon: Sparkles,
			badge: 'Fleksibel',
			activeMitra: '25 Mitra Online'
		}
	];

	const workflows = [
		{
			step: '01',
			title: 'Tulis Titipan & Lokasi Toko',
			desc: 'Sebutkan toko atau warung tujuan beserta rincian barang dan catatan khusus belanja Anda.'
		},
		{
			step: '02',
			title: 'Mitra Belanja & Foto Struk',
			desc: 'Mitra lokal terdekat datang ke lokasi, membelikan barang, dan mengirimkan foto struk kasir asli untuk konfirmasi harga.'
		},
		{
			step: '03',
			title: 'Antar Cepat & Bayar Transparan',
			desc: 'Barang diantar langsung ke alamat Anda. Bayar sesuai struk riil toko ditambah tarif jastip yang disepakati.'
		}
	];

	const testimonials = [
		{
			quote:
				'Pagi-pagi butuh bumbu dapur dan ayam potong dari Pasar Mayestik tapi anak lagi rewel. Titip lewat Titipin, jam 7 pagi sudah sampai fresh dan struknya rapi!',
			name: 'Sarah Wijaya',
			role: 'Ibu Rumah Tangga',
			location: 'Kebayoran Baru',
			rating: 5
		},
		{
			quote:
				'Kunci apartemen ketinggalan di kantor SCBD saat weekend. Mitra Titipin bantu ambil dan antar ke rumah di Tebet dalam 30 menit. Cepat, komunikatif, dan amanah.',
			name: 'Kevin Pratama',
			role: 'Karyawan Swasta',
			location: 'Tebet',
			rating: 5
		},
		{
			quote:
				'Sering bolak-balik rute Blok M ke Cipete. Sambil jalan ambil titipan pelanggan, lumayan dapat penghasilan tambahan 150-250 ribu per hari secara fleksibel.',
			name: 'Bagus Setiawan',
			role: 'Mitra Jastip Titipin',
			location: 'Jakarta Selatan',
			rating: 5
		}
	];

	const faqs = [
		{
			q: 'Bagaimana cara perhitungan biaya belanjaan di Titipin?',
			a: 'Biaya belanjaan 100% mengikuti total struk kasir fisik asli toko (tanpa markup harga dari kami). Anda hanya membayar total belanja sesuai struk ditambah tarif jasa titip mitra yang disepakati di awal.'
		},
		{
			q: 'Berapa kisaran tarif jasa titip (jastip)?',
			a: 'Tarif jasa titip mulai dari Rp 10.000 untuk jarak dekat (0-3 km) dan bervariasi sesuai jarak pengantaran serta kompleksitas titipan. Rincian tarif selalu disepakati secara transparan sebelum mitra berbelanja.'
		},
		{
			q: 'Apakah bisa titip ke warung tenda atau gerai kaki lima yang tidak ada struk kasirnya?',
			a: 'Tentu bisa. Mitra kami akan mengonfirmasi harga langsung di tempat melalui foto harga daftar menu atau bukti pembayaran nota warung kepada Anda via chat sebelum membeli.'
		},
		{
			q: 'Bagaimana jika barang yang dititipkan sedang habis di toko?',
			a: 'Mitra akan segera mengabari Anda melalui chat/panggilan untuk memberikan alternatif barang, pindah ke gerai cabang terdekat, atau membatalkan titipan tanpa penalti.'
		}
	];

	let openFaq = $state<number | null>(0);

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}
</script>

<svelte:head>
	<title>Titipin - Layanan Jastip Belanja & Pengantaran Lokal Terpercaya</title>
	<meta
		name="description"
		content="Titip belanja apa pun dari resto viral, pasar pagi, apotek darurat, atau antar dokumen dengan struk toko asli dan tarif transparan."
	/>
</svelte:head>

<div class="space-y-16 sm:space-y-24">
	<!-- 1. HERO SECTION -->
	<section
		class="relative overflow-hidden border-b border-border/60 bg-muted/20 pt-8 pb-14 sm:pt-14 sm:pb-20"
	>
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
				<!-- Hero Left: Pitch & Quick Search -->
				<div class="space-y-6 text-center sm:text-left lg:col-span-7">
					<!-- Active Indicator Badge -->
					<div
						class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
					>
						<span class="relative flex size-2">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
							></span>
							<span class="relative inline-flex size-2 rounded-full bg-primary"></span>
						</span>
						<span>Layanan Jastip Lokal Aktif di Jabodetabek</span>
					</div>

					<!-- Hero Headline -->
					<div class="space-y-3">
						<h1
							class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.15]"
						>
							Titip Belanja Apa Pun, Dari Mana Saja. <span class="text-primary">
								Diantar Cepat.
							</span>
						</h1>
						<p class="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
							Kuliner kaki lima tanpa ojol, sayur segar pasar subuh, obat apotek darurat, hingga
							barang tertinggal. Mitra lokal terpercaya siap bantu dengan <strong
								class="font-semibold text-foreground"
							>
								struk kasir asli
							</strong> dan tarif transparan.
						</p>
					</div>

					<!-- Quick Search / Titip Input Box -->
					<div class="rounded-2xl border border-border/90 bg-card p-3 shadow-md sm:p-4">
						<div class="flex flex-col gap-2.5 sm:flex-row">
							<!-- Location Selector -->
							<div class="relative shrink-0 sm:w-44">
								<MapPin class="pointer-events-none absolute top-3 left-3 size-4 text-primary" />
								<select
									bind:value={selectedLocation}
									class="h-10 w-full rounded-xl border border-border bg-muted/40 pr-6 pl-9 text-xs font-semibold text-foreground transition-colors focus:border-primary focus:outline-none"
									aria-label="Pilih Lokasi Wilayah"
								>
									{#each locations as loc (loc)}
										<option value={loc}>{loc}</option>
									{/each}
								</select>
							</div>

							<!-- Item Input -->
							<div class="relative flex-1">
								<Search
									class="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
								/>
								<Input
									type="text"
									enterkeyhint="search"
									bind:value={searchQuery}
									placeholder="Mau titip apa? Contoh: Martabak San Fransisco, Pasar Santa..."
									class="h-10 rounded-xl border-border bg-background pl-9 text-xs sm:text-sm"
								/>
							</div>

							<!-- Action CTA -->
							<a
								href={resolve('/daftar')}
								class="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:bg-primary/95 active:scale-98 sm:shrink-0"
							>
								<span>Mulai Titip</span>
								<ArrowRight class="size-4" />
							</a>
						</div>

						<!-- Popular Search Chips -->
						<div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							<span class="font-medium text-foreground">Sering dititip:</span>
							<button
								type="button"
								onclick={() => (searchQuery = 'Martabak Pecenongan 65')}
								class="rounded-md bg-muted/60 px-2 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Martabak Pecenongan
							</button>
							<button
								type="button"
								onclick={() => (searchQuery = 'Sayur Segar Pasar Subuh')}
								class="rounded-md bg-muted/60 px-2 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Pasar Subuh
							</button>
							<button
								type="button"
								onclick={() => (searchQuery = 'Obat Apotek K-24')}
								class="rounded-md bg-muted/60 px-2 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Apotek K-24
							</button>
							<button
								type="button"
								onclick={() => (searchQuery = 'Kunci / Dokumen Tertinggal')}
								class="rounded-md bg-muted/60 px-2 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Dokumen Tertinggal
							</button>
						</div>
					</div>

					<!-- Trust Micro-Pills -->
					<div
						class="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground sm:justify-start"
					>
						<div class="flex items-center gap-1.5">
							<Receipt class="size-4 text-primary" />
							<span>100% Struk Kasir Asli</span>
						</div>
						<div class="flex items-center gap-1.5">
							<ShieldCheck class="size-4 text-primary" />
							<span>Mitra Beridentitas Resmi</span>
						</div>
						<div class="flex items-center gap-1.5">
							<BadgeCheck class="size-4 text-primary" />
							<span>Mulai Rp 10.000 / Trip</span>
						</div>
					</div>
				</div>

				<!-- Hero Right: Interactive Simulated Live Jastip Card -->
				<div class="lg:col-span-5">
					<div
						class="mx-auto max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-lg sm:p-6"
					>
						<div class="space-y-4">
							<!-- Header Card -->
							<div class="flex items-center justify-between border-b border-border/70 pb-3">
								<div class="flex items-center gap-2.5">
									<div
										class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
									>
										<ShoppingBag class="size-4" />
									</div>
									<div>
										<p class="text-xs font-bold text-foreground">Titipan Aktif #TP-8921</p>
										<p class="text-xs text-muted-foreground">Area Kebayoran Baru • Live Update</p>
									</div>
								</div>
								<span
									class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
								>
									<span class="size-2 rounded-full bg-primary"></span>
									Sedang Dibelikan
								</span>
							</div>

							<!-- Item Details (Flattened layout without nested card container) -->
							<div class="space-y-2 border-b border-border/70 pb-3">
								<div class="flex items-start justify-between text-xs">
									<div>
										<p class="font-bold text-foreground">Gulai Tikungan (Gultik) Blok M</p>
										<p class="text-xs text-muted-foreground">
											3x Porsi Spesial, Kerupuk Tambah, Sambal Dipisah
										</p>
									</div>
									<span class="font-bold text-foreground">Rp 60.000</span>
								</div>
								<div class="flex items-center justify-between pt-1 text-xs text-muted-foreground">
									<span>Tarif Jastip Mitra</span>
									<span class="font-medium text-foreground">Rp 15.000</span>
								</div>
								<div class="flex items-center justify-between pt-1 text-xs font-bold">
									<span class="text-foreground">Total Transparan</span>
									<span class="text-primary">Rp 75.000</span>
								</div>
							</div>

							<!-- Verified Receipt Status -->
							<div class="flex items-center gap-2 text-xs font-semibold text-foreground">
								<Receipt class="size-4 shrink-0 text-primary" />
								<span>Struk kasir fisik asli dari pedagang terverifikasi</span>
							</div>

							<!-- Assigned Mitra Profile -->
							<div class="flex items-center justify-between border-t border-border/70 pt-3">
								<div class="flex items-center gap-2.5">
									<div
										class="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs"
									>
										DP
									</div>
									<div>
										<p class="text-xs font-bold text-foreground">Dimas Pratama</p>
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<Star class="size-3.5 fill-amber-400 text-amber-400" />
											<span class="font-semibold text-foreground">4.95</span>
											<span>(320+ titipan sukses)</span>
										</div>
									</div>
								</div>
								<div class="text-right">
									<span class="block text-xs text-muted-foreground">Estimasi Tiba</span>
									<span class="text-xs font-bold text-foreground">~15 Menit</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 2. VALUE METRICS STRIP -->
	<section class="mx-auto max-w-6xl px-4 sm:px-6">
		<div
			class="grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:grid-cols-4 sm:p-6"
		>
			<div class="flex items-center gap-3 p-2">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Receipt class="size-5" />
				</div>
				<div>
					<p class="text-lg font-black tracking-tight text-foreground sm:text-xl">100% Asli</p>
					<p class="text-xs text-muted-foreground">Struk toko tanpa mark-up</p>
				</div>
			</div>

			<div class="flex items-center gap-3 p-2">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<BadgeCheck class="size-5" />
				</div>
				<div>
					<p class="text-lg font-black tracking-tight text-foreground sm:text-xl">Rp 10.000</p>
					<p class="text-xs text-muted-foreground">Tarif jastip mulai terendah</p>
				</div>
			</div>

			<div class="flex items-center gap-3 p-2">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Users class="size-5" />
				</div>
				<div>
					<p class="text-lg font-black tracking-tight text-foreground sm:text-xl">500+ Mitra</p>
					<p class="text-xs text-muted-foreground">Tersebar di area lokal</p>
				</div>
			</div>

			<div class="flex items-center gap-3 p-2">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Clock class="size-5" />
				</div>
				<div>
					<p class="text-lg font-black tracking-tight text-foreground sm:text-xl">15-45 Mnt</p>
					<p class="text-xs text-muted-foreground">Langsung dibeli & diantar</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 3. KATEGORI LAYANAN (#eksplor) -->
	<section id="eksplor" class="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
		<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
			<div>
				<div
					class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase"
				>
					<span>Kategori Unggulan</span>
				</div>
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Apa yang Bisa Anda Titipkan?
				</h2>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Mitra Titipin siap mendatangi toko pilihan Anda dan membelikannya langsung.
				</p>
			</div>
			<a
				href={resolve('/daftar')}
				class="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
			>
				<span>Titip Kebutuhan Lainnya</span>
				<ChevronRight class="size-4" />
			</a>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each categories as cat (cat.id)}
				{@const IconComponent = cat.icon}
				<div
					class="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
				>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
							>
								<IconComponent class="size-5" />
							</div>
							<span class="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
								{cat.badge}
							</span>
						</div>

						<div>
							<h3
								class="text-base font-bold text-foreground transition-colors group-hover:text-primary"
							>
								{cat.name}
							</h3>
							<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
								{cat.desc}
							</p>
						</div>

						<div class="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
							<span class="font-medium text-foreground">Contoh:</span>
							{cat.examples}
						</div>
					</div>

					<div
						class="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs"
					>
						<span class="text-xs text-muted-foreground">{cat.activeMitra}</span>
						<a
							href={resolve('/daftar')}
							class="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
						>
							<span>Titip Sekarang</span>
							<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 4. CARA KERJA (WORKFLOW) -->
	<section id="carakerja" class="border-y border-border/60 bg-muted/20 py-14 sm:py-20">
		<div class="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
			<div class="mx-auto max-w-2xl space-y-2 text-center">
				<div
					class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase"
				>
					<span>Proses Mudah</span>
				</div>
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Cara Kerja Jastip di Titipin
				</h2>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Tiga langkah ringkas untuk memesan apa pun tanpa repot keluar rumah.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
				{#each workflows as flow (flow.step)}
					<div
						class="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs"
					>
						<div class="space-y-3">
							<span class="text-3xl font-black text-primary">
								{flow.step}
							</span>
							<h3 class="text-base font-bold text-foreground">
								{flow.title}
							</h3>
							<p class="text-xs leading-relaxed text-muted-foreground">
								{flow.desc}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 5. KEUNGGULAN (MENGAPA TITIPIN BERBEDA) -->
	<section id="keunggulan" class="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
		<div class="mx-auto max-w-2xl space-y-2 text-center">
			<div
				class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase"
			>
				<span>Keunggulan Nyata</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Mengapa Memilih Titipin?
			</h2>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Solusi personal yang fleksibel, jujur, dan tidak dibatasi oleh menu aplikasi besar.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Store class="size-5" />
				</div>
				<div class="space-y-1.5">
					<h3 class="text-base font-bold text-foreground">Bebas Pesan Dari Toko Mana Pun</h3>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Warung gang favorit, gerai kaki lima legendaris, atau minimarket spesifik yang belum
						bermitra dengan aplikasi pesan-antar besar tetap bisa Anda beli lewat mitra kami.
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Receipt class="size-5" />
				</div>
				<div class="space-y-1.5">
					<h3 class="text-base font-bold text-foreground">Tanpa Markup Harga Barang</h3>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Anda membayar harga barang riil sesuai yang tercetak di struk kasir toko. Tidak ada
						penggelembungan harga makanan atau barang hingga 20-30%.
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<HeartHandshake class="size-5" />
				</div>
				<div class="space-y-1.5">
					<h3 class="text-base font-bold text-foreground">Bisa Request Catatan Khusus</h3>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Bebas berikan instruksi belanja spesifik, seperti "pilih mangga yang manis", "minta
						sambal dipisah", atau "tanyakan kasir apakah ada promo kemasan bundling".
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
					<Users class="size-5" />
				</div>
				<div class="space-y-1.5">
					<h3 class="text-base font-bold text-foreground">Dukungan Ekonomi Lokal</h3>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Tarif jasa titip langsung menjadi penghasilan riil bagi mitra di lingkungan sekitar
						Anda, sekaligus membantu memajukan pedagang pasar dan warung UMKM.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 6. TESTIMONI PENGGUNA & MITRA -->
	<section class="border-t border-border/60 bg-muted/20 py-14 sm:py-20">
		<div class="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
			<div class="mx-auto max-w-2xl space-y-2 text-center">
				<div
					class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase"
				>
					<span>Suara Komunitas</span>
				</div>
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Dipercaya Pelanggan & Mitra
				</h2>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Pengalaman nyata mereka yang telah merasakan kemudahan titip belanja lokal.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
				{#each testimonials as test (test.name)}
					<div
						class="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs"
					>
						<div class="space-y-3">
							<div class="flex items-center gap-1 text-amber-400">
								{#each getStars(test.rating) as starIdx (starIdx)}
									<Star class="size-4 fill-amber-400 text-amber-400" />
								{/each}
							</div>
							<p class="text-xs leading-relaxed text-foreground italic">
								"{test.quote}"
							</p>
						</div>

						<div class="mt-5 border-t border-border/60 pt-3">
							<p class="text-xs font-bold text-foreground">{test.name}</p>
							<p class="text-xs text-muted-foreground">{test.role} • {test.location}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 7. DUAL CALL TO ACTION -->
	<section class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="grid gap-6 md:grid-cols-2">
			<!-- CTA Pelanggan -->
			<div
				class="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-md sm:p-8"
			>
				<div class="space-y-3">
					<div
						class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs"
					>
						<ShoppingBag class="size-3.5" />
						<span>Untuk Pelanggan</span>
					</div>
					<h3 class="text-xl font-extrabold text-white sm:text-2xl">
						Butuh Belanjaan Tanpa Keluar Rumah?
					</h3>
					<p class="text-xs leading-relaxed text-white/90 sm:text-sm">
						Daftar akun gratis dalam 30 detik. Hubungi mitra lokal dan titip apa pun dengan struk
						asli.
					</p>
					<div class="pt-2">
						<a
							href={resolve('/daftar')}
							class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-primary shadow-sm transition-transform hover:bg-white/95 active:scale-98"
						>
							<span>Daftar Sebagai Pelanggan</span>
							<ArrowRight class="size-4" />
						</a>
					</div>
				</div>
			</div>

			<!-- CTA Mitra -->
			<div
				class="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-md sm:p-8"
			>
				<div class="space-y-3">
					<div
						class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
					>
						<Users class="size-3.5" />
						<span>Peluang Penghasilan</span>
					</div>
					<h3 class="text-xl font-extrabold text-foreground sm:text-2xl">
						Punya Waktu Luang & Sering Jalan?
					</h3>
					<p class="text-xs leading-relaxed text-muted-foreground sm:text-sm">
						Gabung menjadi Mitra Jastip Titipin. Dapatkan komisi transparan dari setiap pesanan yang
						Anda antarkan.
					</p>
					<div class="pt-2">
						<a
							href={resolve('/daftar')}
							class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-98"
						>
							<span>Daftar Jadi Mitra Jastip</span>
							<ArrowRight class="size-4" />
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 8. FAQ ACCORDION (#bantuan) -->
	<section id="bantuan" class="mx-auto max-w-3xl space-y-6 px-4 pb-12 sm:px-6">
		<div class="space-y-2 text-center">
			<div
				class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase"
			>
				<span>Tanya Jawab</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Pertanyaan yang Sering Diajukan
			</h2>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Segala hal yang perlu Anda ketahui sebelum menggunakan layanan Titipin.
			</p>
		</div>

		<div class="space-y-3">
			{#each faqs as faq, i (faq.q)}
				<div class="overflow-hidden rounded-xl border border-border/80 bg-card">
					<button
						type="button"
						class="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-foreground transition-colors hover:bg-muted/40 sm:text-sm"
						onclick={() => toggleFaq(i)}
						aria-expanded={openFaq === i}
					>
						<span>{faq.q}</span>
						<ChevronRight
							class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 {openFaq ===
							i
								? 'rotate-90'
								: ''}"
						/>
					</button>
					{#if openFaq === i}
						<div
							class="border-t border-border/60 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground"
						>
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
</div>
