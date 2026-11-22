<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolve } from '$app/paths';
	import {
		Home,
		ShoppingBag,
		MessageSquare,
		User as UserIcon,
		Compass,
		HelpCircle,
		LogOut
	} from 'lucide-svelte';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Titipin - Jastip & Pengantaran Lokal Praktis</title>
	<meta
		name="description"
		content="Layanan jasa titip belanja, pengambilan barang, dan pengantaran lokal terpercaya."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-background text-foreground antialiased">
	<!-- Desktop Header -->
	<header
		class="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80"
	>
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
			<!-- Brand -->
			<a
				href={resolve('/')}
				class="flex items-center gap-2.5 text-lg font-bold text-primary transition-opacity hover:opacity-90 sm:text-xl"
			>
				<div
					class="flex size-8 items-center justify-center rounded-lg bg-primary text-base font-black text-primary-foreground shadow-sm"
				>
					T
				</div>
				<span class="font-semibold tracking-tight text-foreground">Titipin</span>
			</a>

			<!-- Desktop Nav Links -->
			<nav
				class="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
				aria-label="Navigasi Utama"
			>
				<a href={resolve('/')} class="text-foreground transition-colors hover:text-primary">
					Beranda
				</a>
				<a href="#eksplor" class="transition-colors hover:text-primary">Kategori</a>
				{#if data?.role === 'provider' || data?.role === 'admin'}
					<a href={resolve('/mitra/dashboard')} class="transition-colors hover:text-primary">
						Dashboard Mitra
					</a>
				{/if}
				{#if data?.role === 'admin'}
					<a href={resolve('/admin')} class="text-destructive transition-colors hover:underline">
						Admin
					</a>
				{/if}
				{#if !data?.user || data?.role === 'customer'}
					<a href={resolve('/daftar')} class="transition-colors hover:text-primary">Jadi Mitra</a>
				{/if}
			</nav>

			<!-- Action Buttons / User Status -->
			<div class="flex items-center gap-2.5">
				<a
					href="#bantuan"
					class="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
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
								class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
							>
								{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
							</div>
							<span class="max-w-30 truncate">{data.profile?.full_name || 'Profil'}</span>
							{#if data.role && data.role !== 'customer'}
								<span
									class="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary uppercase"
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
						class="inline-flex h-9 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
					>
						Masuk
					</a>
					<a
						href={resolve('/daftar')}
						class="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
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
		class="hidden border-t border-border/70 bg-card/50 py-8 text-xs text-muted-foreground md:block"
	>
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground"
				>
					T
				</div>
				<span class="font-medium text-foreground">Titipin Indonesia</span>
				<span>&copy; {new Date().getFullYear()}</span>
			</div>
			<p>Platform marketplace jasa titip & layanan lokal.</p>
		</div>
	</footer>

	<!-- Mobile Bottom Navigation -->
	<nav
		class="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-backdrop-filter:bg-background/80 md:hidden"
		aria-label="Navigasi Bawah Mobile"
	>
		<div class="mx-auto grid h-16 max-w-lg grid-cols-5">
			<a
				href={resolve('/')}
				class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Home class="size-5" />
				<span>Beranda</span>
			</a>
			<a
				href="#eksplor"
				class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<Compass class="size-5" />
				<span>Eksplor</span>
			</a>
			<a
				href="#pesanan"
				class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<ShoppingBag class="size-5" />
				<span>Pesanan</span>
			</a>
			<a
				href="#pesan"
				class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
			>
				<MessageSquare class="size-5" />
				<span>Pesan</span>
			</a>
			{#if data?.user}
				<a
					href={resolve('/profil')}
					class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-5" />
					<span>Profil</span>
				</a>
			{:else}
				<a
					href={resolve('/masuk')}
					class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-all hover:text-primary active:scale-95"
				>
					<UserIcon class="size-5" />
					<span>Masuk</span>
				</a>
			{/if}
		</div>
	</nav>
</div>
