<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolve } from '$app/paths';
	import {
		Home,
		Compass,
		ShoppingBag,
		User as UserIcon,
		ShieldCheck
	} from 'lucide-svelte';

	let { children, data }: LayoutProps = $props();

	const displayName = $derived.by(() => {
		if (!data?.profile?.full_name) return 'Profil';
		return data.profile.full_name.trim().split(' ')[0] || 'Profil';
	});
</script>

<svelte:head>
	<title>Titipin - Layanan Jastip Belanja & Pengantaran Lokal Terpercaya</title>
	<meta
		name="description"
		content="Layanan jasa titip belanja, pengambilan barang, dan pengantaran lokal terpercaya dengan struk toko asli."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="flex min-h-dvh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary"
>
	<!-- Modern Minimal Header -->
	<header
		class="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md"
	>
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
			<!-- Brand & Links -->
			<div class="flex items-center gap-7">
				<a
					href={resolve('/')}
					class="flex items-center gap-2 font-bold tracking-tight text-foreground"
				>
					<div
						class="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-black text-primary-foreground"
					>
						T
					</div>
					<span class="text-base font-extrabold tracking-tight">Titipin</span>
				</a>

				<!-- Desktop Main Navigation -->
				<nav
					class="hidden items-center gap-5 text-xs font-medium text-muted-foreground md:flex"
					aria-label="Navigasi Utama"
				>
					<a
						href="{resolve('/')}#eksplor"
						class="transition-colors hover:text-foreground"
					>
						Kategori
					</a>
					<a
						href="{resolve('/')}#carakerja"
						class="transition-colors hover:text-foreground"
					>
						Cara Kerja
					</a>
					<a
						href="{resolve('/')}#keunggulan"
						class="transition-colors hover:text-foreground"
					>
						Keunggulan
					</a>
				</nav>
			</div>

			<!-- User Profile Drop / Auth CTA -->
			<div class="flex items-center gap-3">
				{#if data?.user}
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
						{#if data?.role === 'admin'}
							<span
								class="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary uppercase"
							>
								Admin
							</span>
						{/if}
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
		<div class="mx-auto max-w-5xl px-4 sm:px-6">
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
						Layanan jasa titip belanja & pengantaran lokal terpercaya dengan struk kasir toko fisik asli.
					</p>
					<div class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
						<ShieldCheck class="size-4 text-primary" />
						<span>100% Struk Kasir Asli & Terverifikasi</span>
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
					</ul>
				</div>

				<div class="col-span-3 space-y-2">
					<p class="font-bold text-foreground">Wilayah Operasional</p>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Kecamatan Gatak, Gawok, Trangsan, Mayang, Kartasura, Baki, dan sekitarnya (Sukoharjo / Solo Raya).
					</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs sm:flex-row"
			>
				<p>
					&copy; {new Date().getFullYear()} Titipin Indonesia.
				</p>
				<div class="flex items-center gap-4">
					<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-foreground">
						Ketentuan
					</a>
					<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-foreground">
						Privasi
					</a>
				</div>
			</div>
		</div>
	</footer>

	<!-- Mobile Bottom Navigation Bar -->
	<nav
		class="fixed right-0 bottom-0 left-0 z-40 border-t border-border/70 bg-background/95 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md supports-backdrop-filter:bg-background/85 md:hidden"
		aria-label="Navigasi Bawah Mobile"
	>
		<div class="mx-auto grid h-14 max-w-lg grid-cols-4 px-2">
			<a
				href={resolve('/')}
				class="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Home class="size-4.5" />
				<span class="text-[11px]">Beranda</span>
			</a>
			<a
				href="{resolve('/')}#eksplor"
				class="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Compass class="size-4.5" />
				<span class="text-[11px]">Kategori</span>
			</a>
			<a
				href="{resolve('/')}#carakerja"
				class="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<ShoppingBag class="size-4.5" />
				<span class="text-[11px]">Cara Kerja</span>
			</a>
			{#if data?.user}
				<a
					href={resolve('/profil')}
					class="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-4.5" />
					<span class="text-[11px]">Profil</span>
				</a>
			{:else}
				<a
					href={resolve('/masuk')}
					class="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-4.5" />
					<span class="text-[11px]">Masuk</span>
				</a>
			{/if}
		</div>
	</nav>
</div>
