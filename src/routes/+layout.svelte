<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolve } from '$app/paths';
	import {
		Home,
		ShoppingBag,
		HelpCircle,
		User as UserIcon,
		Compass,
		LogOut,
		ShieldCheck
	} from 'lucide-svelte';

	let { children, data }: LayoutProps = $props();
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
	<!-- Desktop Header -->
	<header
		class="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-backdrop-filter:bg-background/80"
	>
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
			<!-- Brand -->
			<a
				href={resolve('/')}
				class="flex items-center gap-2.5 text-lg font-bold text-primary transition-opacity hover:opacity-90 sm:text-xl"
			>
				<div
					class="flex size-8 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground shadow-xs"
				>
					T
				</div>
				<span class="font-extrabold tracking-tight text-foreground">Titipin</span>
			</a>

			<!-- Desktop Nav Links -->
			<nav
				class="hidden items-center gap-6 text-xs font-semibold text-muted-foreground md:flex"
				aria-label="Navigasi Utama"
			>
				<a href={resolve('/')} class="transition-colors hover:text-primary"> Beranda </a>
				<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
					Kategori Layanan
				</a>
				<a href="{resolve('/')}#carakerja" class="transition-colors hover:text-primary">
					Cara Kerja
				</a>
				<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-primary">
					Keunggulan
				</a>
				{#if data?.role === 'provider' || data?.role === 'admin'}
					<a
						href={resolve('/mitra/dashboard')}
						class="font-bold text-primary transition-colors hover:underline"
					>
						Dashboard Mitra
					</a>
				{/if}
				{#if data?.role === 'admin'}
					<a
						href={resolve('/admin')}
						class="font-bold text-destructive transition-colors hover:underline"
					>
						Admin
					</a>
				{/if}
				{#if !data?.user || data?.role === 'customer'}
					<a href={resolve('/daftar')} class="transition-colors hover:text-primary"> Jadi Mitra </a>
				{/if}
			</nav>

			<!-- Action Buttons / User Status -->
			<div class="flex items-center gap-2.5">
				<a
					href="{resolve('/')}#bantuan"
					class="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
				>
					<HelpCircle class="size-4" />
					<span>Bantuan</span>
				</a>

				{#if data?.user}
					<div class="flex items-center gap-2">
						<a
							href={resolve('/profil')}
							class="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
						>
							<div
								class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
							>
								{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
							</div>
							<span class="max-w-28 truncate">{data.profile?.full_name || 'Profil'}</span>
							{#if data.role && data.role !== 'customer'}
								<span
									class="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary uppercase"
								>
									{data.role}
								</span>
							{/if}
						</a>

						<form method="POST" action={resolve('/keluar')} class="hidden sm:inline">
							<button
								type="submit"
								class="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
								title="Keluar"
							>
								<LogOut class="size-3.5" />
								<span class="sr-only">Keluar</span>
							</button>
						</form>
					</div>
				{:else}
					<a
						href={resolve('/masuk')}
						class="inline-flex h-9 items-center justify-center rounded-xl px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
					>
						Masuk
					</a>
					<a
						href={resolve('/daftar')}
						class="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-transform hover:bg-primary/95 active:scale-98"
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

	<!-- Desktop Footer -->
	<footer
		class="hidden border-t border-border/70 bg-card/60 py-12 text-xs text-muted-foreground md:block"
	>
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<div class="grid grid-cols-12 gap-8 pb-8">
				<div class="col-span-4 space-y-3">
					<div class="flex items-center gap-2">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-xs"
						>
							T
						</div>
						<span class="text-base font-bold text-foreground">Titipin Indonesia</span>
					</div>
					<p class="max-w-sm text-xs leading-relaxed text-muted-foreground">
						Platform jasa titip belanja & pengantaran lokal terpercaya. Hubungkan kebutuhan belanja
						Anda langsung ke mitra lokal dengan struk asli toko.
					</p>
					<div class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
						<ShieldCheck class="size-4 text-primary" />
						<span>100% Struk Kasir Asli & Terverifikasi</span>
					</div>
				</div>

				<div class="col-span-3 space-y-2.5">
					<p class="font-bold text-foreground">Layanan Utama</p>
					<ul class="space-y-1.5 text-xs">
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Kuliner & Warung Kaki Lima
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Pasar Pagi & Sayur Segar
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Minimarket & Swalayan
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Apotek & Farmasi Darurat
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#eksplor" class="transition-colors hover:text-primary">
								Ambil & Antar Dokumen
							</a>
						</li>
					</ul>
				</div>

				<div class="col-span-3 space-y-2.5">
					<p class="font-bold text-foreground">Peluang & Mitra</p>
					<ul class="space-y-1.5 text-xs">
						<li>
							<a href={resolve('/daftar')} class="transition-colors hover:text-primary">
								Daftar Jadi Mitra Jastip
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#carakerja" class="transition-colors hover:text-primary">
								Alur & Cara Kerja
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#keunggulan" class="transition-colors hover:text-primary">
								Transparansi Tarif Jastip
							</a>
						</li>
						<li>
							<a href="{resolve('/')}#bantuan" class="transition-colors hover:text-primary">
								Pusat Bantuan
							</a>
						</li>
					</ul>
				</div>

				<div class="col-span-2 space-y-2.5">
					<p class="font-bold text-foreground">Wilayah Layanan</p>
					<ul class="space-y-1 text-xs text-muted-foreground">
						<li>Jakarta Selatan</li>
						<li>Jakarta Pusat & Barat</li>
						<li>Jakarta Timur & Utara</li>
						<li>Tangerang Selatan</li>
						<li>Depok & Sekitarnya</li>
					</ul>
				</div>
			</div>

			<div
				class="flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs sm:flex-row"
			>
				<p>
					&copy; {new Date().getFullYear()} Titipin Indonesia. Hak cipta dilindungi undang-undang.
				</p>
				<div class="flex items-center gap-4">
					<a href="{resolve('/')}#bantuan" class="transition-colors hover:text-foreground">
						Ketentuan Layanan
					</a>
					<a href="{resolve('/')}#bantuan" class="transition-colors hover:text-foreground">
						Kebijakan Privasi
					</a>
				</div>
			</div>
		</div>
	</footer>

	<!-- Mobile Bottom Navigation -->
	<nav
		class="fixed right-0 bottom-0 left-0 z-40 border-t border-border/80 bg-background/95 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md supports-backdrop-filter:bg-background/80 md:hidden"
		aria-label="Navigasi Bawah Mobile"
	>
		<div class="mx-auto grid h-16 max-w-lg grid-cols-4">
			<a
				href={resolve('/')}
				class="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Home class="size-5" />
				<span>Beranda</span>
			</a>
			<a
				href="{resolve('/')}#eksplor"
				class="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Compass class="size-5" />
				<span>Kategori</span>
			</a>
			<a
				href="{resolve('/')}#carakerja"
				class="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<ShoppingBag class="size-5" />
				<span>Cara Kerja</span>
			</a>
			{#if data?.user}
				<a
					href={resolve('/profil')}
					class="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-5" />
					<span>Profil</span>
				</a>
			{:else}
				<a
					href={resolve('/masuk')}
					class="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-5" />
					<span>Masuk</span>
				</a>
			{/if}
		</div>
	</nav>
</div>
