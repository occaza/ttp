<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		ChevronRight,
		MapPin,
		Star,
		ShieldCheck,
		Receipt,
		Clock,
		CheckCircle2,
		MessageSquare,
		ArrowRight,
		ShoppingBag,
		Utensils,
		Store,
		Carrot,
		Pill,
		Truck,
		HandHelping,
		Wrench
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const s = $derived(data.service);

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

	const CategoryIcon = $derived(getCategoryIcon(s.category?.slug));

	// WhatsApp direct URL generator
	const whatsappUrl = $derived.by(() => {
		const rawPhone = s.provider?.phone || '';
		const cleanPhone = rawPhone.replace(/\D/g, '');
		const formattedPhone = cleanPhone.startsWith('0')
			? '62' + cleanPhone.slice(1)
			: cleanPhone.startsWith('62')
				? cleanPhone
				: '62' + cleanPhone;

		const message = encodeURIComponent(
			`Halo Titipin, saya melihat layanan "${s.title}" dan ingin memesan jastip.`
		);
		return `https://wa.me/${formattedPhone}?text=${message}`;
	});
</script>

<svelte:head>
	<title>{s.title} - Titipin Jastip Lokal</title>
	<meta
		name="description"
		content="{s.title} di area {s.coverage_area}. Dibelikan dan diantar langsung dengan tarif jastip flat."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Breadcrumbs -->
	<nav class="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
		<a href={resolve('/')} class="hover:text-foreground">Beranda</a>
		<ChevronRight class="size-3.5" />
		<a href={resolve('/layanan')} class="hover:text-foreground">Layanan</a>
		<ChevronRight class="size-3.5" />
		<span class="truncate font-semibold text-foreground">{s.title}</span>
	</nav>

	<!-- Main 12-Column Layout -->
	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
		<!-- Left Main Column (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Header Banner -->
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
				<div class="flex items-center justify-between border-b border-border/60 pb-4">
					<div class="flex items-center gap-2">
						<div
							class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<CategoryIcon class="size-4" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">
							{s.category?.name || 'Jastip Lokal'}
						</span>
					</div>

					<span
						class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600"
					>
						<span class="size-1.5 rounded-full bg-emerald-500"></span>
						<span>Layanan Aktif</span>
					</span>
				</div>

				<h1 class="mt-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					{s.title}
				</h1>

				<div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
					<div class="flex items-center gap-1.5">
						<MapPin class="size-4 text-primary" />
						<span>Cakupan: <strong>{s.coverage_area}</strong></span>
					</div>
					<div class="flex items-center gap-1.5">
						<Clock class="size-4 text-primary" />
						<span>Estimasi: <strong>25 - 45 Menit</strong></span>
					</div>
				</div>
			</div>

			<!-- Service Description & Transparency Rules -->
			<div class="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div>
					<h2 class="text-base font-bold text-foreground">Deskripsi & Ketentuan Titip</h2>
					<p class="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{s.description ||
							'Layanan jastip belanja lokal siap membelikan kebutuhan Anda di warung makan, pasar tradisional, atau toko pilihan. Barang langsung diantar ke alamat Anda.'}
					</p>
				</div>

				<div class="border-t border-border/60 pt-5">
					<h3 class="text-xs font-bold tracking-wide text-foreground uppercase">
						Rincian Layanan Titipin
					</h3>
					<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div
							class="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
						>
							<Receipt class="mt-0.5 size-4 shrink-0 text-primary" />
							<div>
								<span class="font-bold text-foreground">Sesuai Nota Toko</span>
								<p class="mt-0.5 text-[11px] text-muted-foreground">
									Harga barang mengikuti nota belanja di toko tujuan.
								</p>
							</div>
						</div>

						<div
							class="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
						>
							<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
							<div>
								<span class="font-bold text-foreground">Catatan Detail Dituruti</span>
								<p class="mt-0.5 text-[11px] text-muted-foreground">
									Tingkat kepedasan, kematangan, atau merek spesifik dibaca teliti.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- How Ordering Works for this Service -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-6">
				<h3 class="text-sm font-bold text-foreground">Alur Pemesanan Jastip Ini</h3>
				<ol class="space-y-3 text-xs text-muted-foreground">
					<li class="flex items-start gap-2.5">
						<span
							class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
						>
							1
						</span>
						<span>
							Klik tombol <strong>Mulai Buat Pesanan</strong> dan tuliskan daftar belanjaan beserta alamat
							pengantaran Anda.
						</span>
					</li>
					<li class="flex items-start gap-2.5">
						<span
							class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
						>
							2
						</span>
						<span>
							Pesanan dikonfirmasi, langsung dibelikan ke toko tujuan, dan foto nota belanja dikirim
							di detail pesanan.
						</span>
					</li>
					<li class="flex items-start gap-2.5">
						<span
							class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
						>
							3
						</span>
						<span>
							Pesanan diantar sampai depan pintu. Anda membayar total belanja sesuai nota ditambah
							tarif jastip.
						</span>
					</li>
				</ol>
			</div>

			<!-- Provider Rating Summary & Reviews -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div
					class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3"
				>
					<h3 class="text-sm font-bold text-foreground">Ulasan &amp; Rating Pelanggan</h3>
					<div class="flex items-center gap-1.5 text-xs font-bold text-foreground tabular-nums">
						<Star class="size-4 fill-amber-400 text-amber-400" />
						<span>{data.ratingSummary.ratingAvg.toFixed(1)}</span>
						<span class="font-normal text-muted-foreground">
							({data.ratingSummary.ratingCount} ulasan)
						</span>
					</div>
				</div>

				{#if data.ratingSummary.recentReviews.length === 0}
					<p class="text-xs text-muted-foreground">
						Belum ada ulasan tertulis untuk layanan ini. Ulasan hanya dapat dikirim oleh pelanggan
						setelah pesanan selesai.
					</p>
				{:else}
					<div class="divide-y divide-border/50">
						{#each data.ratingSummary.recentReviews as rev (rev.id)}
							<div class="space-y-1 py-3 text-xs">
								<div class="flex items-center justify-between">
									<span class="font-bold text-foreground">{rev.customer_name || 'Pelanggan'}</span>
									<div class="flex items-center gap-0.5">
										{#each [1, 2, 3, 4, 5] as star (star)}
											<Star
												class="size-3.5 {star <= rev.rating
													? 'fill-amber-400 text-amber-400'
													: 'text-muted-foreground/30'}"
											/>
										{/each}
									</div>
								</div>
								{#if rev.comment}
									<p class="leading-relaxed text-muted-foreground">{rev.comment}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column / Sticky Action Box (4 cols) -->
		<div class="space-y-6 lg:sticky lg:top-20 lg:col-span-4">
			<!-- Pricing Card -->
			<div class="rounded-2xl border border-primary/30 bg-card p-6 shadow-md">
				<span class="text-xs font-semibold text-muted-foreground">Tarif Jasa Titip (Flat)</span>
				<div class="mt-1 flex items-baseline gap-1.5">
					<span class="text-3xl font-black text-primary">
						Rp {Number(s.base_fee).toLocaleString('id-ID')}
					</span>
					<span class="text-xs text-muted-foreground">/ pesanan</span>
				</div>
				<p class="mt-2 text-[11px] leading-relaxed text-muted-foreground">
					Tarif jasa flat untuk area {s.coverage_area}. Harga barang dibayar terpisah sesuai nota
					toko.
				</p>

				<div class="mt-5 space-y-2.5">
					<Button
						class="h-11 w-full gap-2 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-98"
						href={data.user ? `${resolve('/pesan')}?service_id=${s.id}` : resolve('/daftar')}
					>
						<span>Mulai Buat Pesanan</span>
						<ArrowRight class="size-4" />
					</Button>

					{#if s.provider?.phone}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={whatsappUrl}
							target="_blank"
							rel="external noopener noreferrer"
							class="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
						>
							<MessageSquare class="size-3.5" />
							<span>Hubungi via WhatsApp</span>
						</a>
					{/if}
				</div>
			</div>

			<!-- Provider Profile Box -->
			<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<span class="text-xs font-bold text-foreground">Pengelola Layanan Langsung</span>
					<div
						class="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300"
					>
						<Star class="size-3 fill-current text-amber-500" />
						<span>5.0</span>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<div
						class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary"
					>
						{s.provider?.business_name?.charAt(0).toUpperCase() || 'T'}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="truncate text-sm font-bold text-foreground">
								{s.provider?.business_name || 'Titipin Langsung'}
							</span>
							{#if s.provider?.is_verified}
								<ShieldCheck class="size-4 shrink-0 text-primary" />
							{/if}
						</div>
						<span class="block text-xs text-muted-foreground"> Pengelola Langsung Area Gatak </span>
					</div>
				</div>

				{#if s.provider?.bio}
					<p class="border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
						"{s.provider.bio}"
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
