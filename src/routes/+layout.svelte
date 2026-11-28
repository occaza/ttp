<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		Home,
		Compass,
		ShoppingBag,
		User as UserIcon,
		ShieldCheck,
		Bell,
		Store
	} from 'lucide-svelte';

	let { children, data }: LayoutProps = $props();

	let promoOpen = $state(false);
	let hasOpenedPromo = $state(false);
	const currentPath = $derived(page.url.pathname);
	const isHome = $derived(currentPath === '/');
	const isAdmin = $derived(currentPath.startsWith('/admin'));
	const isMitra = $derived(currentPath.startsWith('/mitra'));
	const isServices = $derived(currentPath.startsWith('/layanan'));
	const isCategories = $derived(currentPath.startsWith('/kategori'));
	const isOrders = $derived(currentPath.startsWith('/pesanan'));
	const isProfile = $derived(currentPath.startsWith('/profil'));
	const isAuth = $derived(currentPath.startsWith('/masuk') || currentPath.startsWith('/daftar'));

	const displayName = $derived.by(() => {
		if (!data?.profile?.full_name) return 'Profil';
		return data.profile.full_name.trim().split(' ')[0] || 'Profil';
	});

	$effect(() => {
		const promo = data?.activePromo;
		const path = page.url.pathname;
		if (!promo || path.startsWith('/admin') || path.startsWith('/mitra')) {
			promoOpen = false;
			return;
		}
		try {
			const storageKey = `titipin_promo_dismissed_${promo.id}_${promo.updated_at}`;
			const dismissed = localStorage.getItem(storageKey);
			if (!dismissed) {
				hasOpenedPromo = true;
				promoOpen = true;
			} else {
				promoOpen = false;
			}
		} catch {
			hasOpenedPromo = true;
			promoOpen = true;
		}
	});

	function dismissPromo() {
		const promo = data?.activePromo;
		if (promo) {
			try {
				localStorage.setItem(`titipin_promo_dismissed_${promo.id}_${promo.updated_at}`, '1');
			} catch {
				// ignore storage errors
			}
		}
		promoOpen = false;
	}
</script>

<svelte:head>
	<title>Titipin - Layanan Jastip Belanja &amp; Pengantaran Lokal</title>
	<meta
		name="description"
		content="Layanan jasa titip belanja, pengambilan barang, dan pengantaran lokal di area Gatak dan Kartasura."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="flex min-h-dvh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary"
>
	<!-- Modern Minimal Header -->
	<header
		class="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md"
	>
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
			<!-- Brand & Links -->
			<div class="flex items-center gap-8">
				<a
					href={resolve('/')}
					class="flex items-center gap-2.5 font-bold tracking-tight text-foreground"
				>
					<div
						class="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground"
					>
						T
					</div>
					<span class="text-lg font-black tracking-tight">Titipin</span>
				</a>

				<!-- Desktop Main Navigation -->
				<nav
					class="hidden items-center gap-5 text-xs font-medium text-muted-foreground md:flex"
					aria-label="Navigasi Utama"
				>
					<a
						href={resolve('/layanan')}
						class="transition-colors hover:text-foreground {currentPath.startsWith('/layanan')
							? 'font-semibold text-foreground'
							: ''}"
					>
						Cari Layanan
					</a>
					<a
						href={resolve('/pesan')}
						class="transition-colors hover:text-foreground {currentPath.startsWith('/pesan') &&
						!currentPath.startsWith('/pesanan')
							? 'font-semibold text-foreground'
							: ''}"
					>
						Pesan Jastip
					</a>
					<a
						href="{resolve('/')}#eksplor"
						class="transition-colors hover:text-foreground {currentPath.startsWith('/kategori')
							? 'font-semibold text-foreground'
							: ''}"
					>
						Kategori
					</a>
					<a href="{resolve('/')}#carakerja" class="transition-colors hover:text-foreground">
						Cara Kerja
					</a>
					<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-foreground">
						Keunggulan
					</a>
					<a
						href={resolve('/blog')}
						class="transition-colors hover:text-foreground {currentPath.startsWith('/blog')
							? 'font-semibold text-foreground'
							: ''}"
					>
						Blog
					</a>
				</nav>
			</div>

			<!-- User Profile Drop / Auth CTA -->
			<div class="flex items-center gap-3">
				{#if data?.user}
					<a
						href={resolve('/notifikasi')}
						aria-label="Notifikasi"
						class="relative inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-all hover:border-primary/40 hover:bg-muted/40"
					>
						<Bell class="size-3.5 text-primary" />
						{#if data.unreadNotificationCount > 0}
							<span
								class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white"
							>
								{data.unreadNotificationCount > 9 ? '9+' : data.unreadNotificationCount}
							</span>
						{/if}
					</a>

					{#if data?.role === 'provider' || data?.role === 'admin'}
						<a
							href={resolve('/mitra/dashboard')}
							aria-label="Dashboard Mitra"
							class="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted/40 sm:px-3"
						>
							<Store class="size-3.5 text-primary" />
							<span class="hidden sm:inline">Mitra</span>
						</a>
					{/if}

					{#if data?.role === 'admin'}
						<a
							href={resolve('/admin')}
							aria-label="Panel Admin"
							class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/15 sm:px-3"
						>
							<ShieldCheck class="size-3.5" />
							<span class="hidden sm:inline">Admin</span>
						</a>
					{/if}

					<a
						href={resolve('/profil')}
						class="group flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pr-3 pl-1 shadow-2xs transition-all hover:border-primary/40 hover:bg-muted/40"
					>
						<div
							class="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
						>
							{displayName.charAt(0).toUpperCase()}
						</div>
						<span class="text-xs font-semibold text-foreground group-hover:text-primary">
							{displayName}
						</span>
					</a>
				{:else}
					<a
						href={resolve('/masuk')}
						class="px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Masuk
					</a>
					<a
						href={resolve('/daftar')}
						class="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-2xs transition-transform hover:bg-primary/95 active:scale-98"
					>
						Daftar
					</a>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 pb-20 md:pb-8">
		{@render children()}
	</main>

	<!-- Clean Footer -->
	<footer
		class="hidden border-t border-border/50 bg-card/40 py-10 text-xs text-muted-foreground md:block"
	>
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="grid grid-cols-12 gap-8 pb-8">
				<div class="col-span-5 space-y-3">
					<div class="flex items-center gap-2">
						<div
							class="flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-black text-primary-foreground"
						>
							T
						</div>
						<span class="text-sm font-bold text-foreground">Titipin Indonesia</span>
					</div>
					<p class="max-w-sm text-xs leading-relaxed text-muted-foreground">
						Layanan jasa titip belanja &amp; pengantaran lokal di area Gatak, Kartasura, dan
						sekitarnya.
					</p>
					<div class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
						<ShieldCheck class="size-4 text-primary" />
						<span>Harga belanja sesuai nota toko</span>
					</div>
				</div>

				<div class="col-span-4 space-y-2">
					<p class="font-bold text-foreground">Navigasi</p>
					<ul class="space-y-1.5 text-xs">
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Kategori Layanan
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#carakerja" class="transition-colors hover:text-primary">
								Alur Cara Kerja
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-primary">
								Keunggulan & Tarif
							</a>
						</li>
						<li>
							<a href={resolve('/blog')} class="transition-colors hover:text-primary">
								Blog &amp; Kabar
							</a>
						</li>
					</ul>
				</div>

				<div class="col-span-3 space-y-2">
					<p class="font-bold text-foreground">Wilayah Operasional</p>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Kecamatan Gatak, Gawok, Trangsan, Mayang, Kartasura, Baki, dan sekitarnya (Sukoharjo /
						Solo Raya).
					</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs sm:flex-row"
			>
				<p>
					&copy; {new Date().getFullYear()} Titipin Indonesia.
				</p>
				<div class="flex flex-wrap items-center gap-4">
					{#if data?.publishedPages && data.publishedPages.length > 0}
						{#each data.publishedPages as pg (pg.slug)}
							<a
								href={resolve('/p/[slug]', { slug: pg.slug })}
								class="transition-colors hover:text-foreground"
							>
								{pg.title}
							</a>
						{/each}
					{:else}
						<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-foreground">
							Ketentuan
						</a>
						<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-foreground">
							Privasi
						</a>
					{/if}
				</div>
			</div>
		</div>
	</footer>

	<!-- Mobile Bottom Navigation Bar -->
	{#snippet dockItem(href: string, label: string, active: boolean, Icon: typeof Home)}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			{href}
			aria-current={active ? 'page' : undefined}
			aria-label={label}
			title={label}
			class="titipin-dock-item flex items-center justify-center rounded-full active:scale-[0.96] {active
				? 'gap-2 bg-primary/12 px-4 py-2 font-semibold text-primary'
				: 'min-h-11 min-w-11 text-muted-foreground'}"
		>
			<Icon class={active ? 'size-4.5 shrink-0' : 'size-5 shrink-0'} />
			{#if active}
				<span class="titipin-dock-label text-xs whitespace-nowrap">{label}</span>
			{/if}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/snippet}

	<nav
		class="fixed right-0 bottom-0 left-0 z-40 rounded-t-2xl border-t border-border/70 bg-background/95 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_-6px_oklch(0_0_0/0.06)] backdrop-blur-md supports-backdrop-filter:bg-background/85 md:hidden"
		aria-label="Navigasi Bawah Mobile"
	>
		<div class="mx-auto flex h-15 max-w-lg items-center justify-around px-3 py-1.5">
			{@render dockItem(resolve('/'), 'Beranda', isHome, Home)}

			{#if data?.user}
				{#if data.role === 'admin'}
					{@render dockItem(resolve('/admin'), 'Admin', isAdmin, ShieldCheck)}
				{:else if data.role === 'provider'}
					{@render dockItem(resolve('/mitra/dashboard'), 'Mitra', isMitra, Store)}
				{:else}
					{@render dockItem(resolve('/kategori'), 'Kategori', isCategories, Compass)}
				{/if}

				{@render dockItem(resolve('/pesanan'), 'Pesanan', isOrders, ShoppingBag)}
				{@render dockItem(resolve('/profil'), 'Profil', isProfile, UserIcon)}
			{:else}
				{@render dockItem(resolve('/layanan'), 'Layanan', isServices, Store)}
				{@render dockItem(resolve('/kategori'), 'Kategori', isCategories, Compass)}
				{@render dockItem(resolve('/masuk'), 'Masuk', isAuth, UserIcon)}
			{/if}
		</div>
	</nav>
</div>

<!-- Promo Popup -->
{#if data?.activePromo}
	<Dialog.Root
		bind:open={promoOpen}
		onOpenChange={(nextOpen) => {
			if (!nextOpen && hasOpenedPromo) dismissPromo();
		}}
	>
		<Dialog.Content class="max-w-md overflow-hidden rounded-2xl p-0">
			{#if data.activePromo.image_url}
				<img
					src={data.activePromo.image_url}
					alt={data.activePromo.title}
					class="max-h-56 w-full object-cover"
				/>
			{/if}
			<div class="space-y-3 p-5 sm:p-6">
				<Dialog.Header class="text-left">
					<Dialog.Title class="text-lg font-bold text-foreground">
						{data.activePromo.title}
					</Dialog.Title>
					<Dialog.Description class="text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{data.activePromo.description}
					</Dialog.Description>
				</Dialog.Header>

				<div class="flex flex-wrap items-center justify-end gap-2 pt-2">
					<Button variant="outline" size="sm" onclick={dismissPromo} class="h-9 text-xs">
						Tutup
					</Button>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<Button
						size="sm"
						href={data.activePromo.cta_href}
						onclick={dismissPromo}
						class="h-9 text-xs font-bold"
					>
						{data.activePromo.cta_label || 'Lihat Promo'}
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
