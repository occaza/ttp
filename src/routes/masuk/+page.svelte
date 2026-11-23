<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import {
		Lock,
		Mail,
		AlertCircle,
		ArrowRight,
		Eye,
		EyeOff,
		CheckCircle2,
		ShieldCheck,
		Receipt,
		ArrowLeft,
		ShoppingBag
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Masuk ke Akun - Titipin</title>
	<meta
		name="description"
		content="Masuk ke akun Titipin untuk memesan jasa titip belanja lokal atau mengelola pesanan mitra Anda."
	/>
</svelte:head>

<div
	class="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6"
>
	<div
		class="grid w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg md:grid-cols-12"
	>
		<!-- Left Visual Panel (Desktop Only) -->
		<div
			class="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:col-span-5 md:flex lg:p-10"
		>
			<!-- Brand Identity Header -->
			<div class="relative z-10 space-y-4">
				<a
					href={resolve('/')}
					class="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/90 transition-opacity hover:opacity-100"
				>
					<ArrowLeft class="size-4" />
					<span>Kembali ke Beranda</span>
				</a>
				<div class="pt-4">
					<div
						class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs"
					>
						<ShoppingBag class="size-3.5" />
						<span>Jastip & Kurir Lokal Terpercaya</span>
					</div>
					<h2 class="mt-4 text-2xl font-black tracking-tight text-white lg:text-3xl">
						Titip belanjaan apapun tanpa repot antre dan macet.
					</h2>
				</div>
			</div>

			<!-- Live Order Micro-Preview -->
			<div
				class="relative z-10 my-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
			>
				<div class="flex items-center justify-between border-b border-white/15 pb-2.5 text-xs">
					<span class="font-semibold text-white">Simulasi Titipan Aktif</span>
					<span
						class="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase"
					>
						Selesai Diantar
					</span>
				</div>
				<div class="mt-2.5 space-y-1.5 text-xs text-white/90">
					<div class="flex justify-between">
						<span>Martabak Spesial Pecenongan</span>
						<span class="font-medium text-white">Rp 75.000</span>
					</div>
					<div class="flex justify-between text-[11px] text-white/75">
						<span>Tarif Jastip Mitra Lokal</span>
						<span class="font-medium text-white">Rp 12.000</span>
					</div>
				</div>
				<div
					class="mt-3 flex items-center gap-2 rounded-lg bg-black/15 p-2 text-[11px] text-white/85"
				>
					<Receipt class="size-3.5 shrink-0 text-emerald-300" />
					<span>Foto struk kasir asli terverifikasi</span>
				</div>
			</div>

			<!-- Bottom Trust Highlights -->
			<div
				class="relative z-10 space-y-2 border-t border-white/15 pt-5 text-xs text-primary-foreground/90"
			>
				<div class="flex items-center gap-2">
					<CheckCircle2 class="size-4 shrink-0 text-emerald-300" />
					<span>Harga belanjaan sesuai struk toko asli</span>
				</div>
				<div class="flex items-center gap-2">
					<ShieldCheck class="size-4 shrink-0 text-emerald-300" />
					<span>Mitra terverifikasi dengan identitas resmi</span>
				</div>
			</div>
		</div>

		<!-- Right Form Column -->
		<div class="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 lg:p-10">
			<!-- Mobile Back Button -->
			<div class="mb-6 flex items-center justify-between md:hidden">
				<a
					href={resolve('/')}
					class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft class="size-4" />
					<span>Kembali ke Beranda</span>
				</a>
				<div
					class="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground"
				>
					T
				</div>
			</div>

			<div class="space-y-2">
				<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Masuk ke Akun</h1>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Gunakan akun terdaftar Anda untuk memesan atau memantau status titipan.
				</p>
			</div>

			{#if data.registered}
				<div
					class="mt-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary"
					role="status"
				>
					<CheckCircle2 class="mt-0.5 size-4 shrink-0" />
					<div>
						<p class="font-semibold">Pendaftaran Berhasil</p>
						<p class="mt-0.5">
							Akun Anda telah dibuat. Silakan periksa inbox email Anda untuk konfirmasi (jika
							verifikasi email aktif), lalu masuk menggunakan kata sandi Anda.
						</p>
					</div>
				</div>
			{/if}

			{#if form?.error}
				<div
					class="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
					role="alert"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0" />
					<div>
						<p class="font-semibold">Gagal masuk</p>
						<p class="mt-0.5">{form.error}</p>
					</div>
				</div>
			{/if}

			<form
				method="POST"
				class="mt-6 space-y-4"
				onsubmit={() => {
					loading = true;
				}}
			>
				<!-- Email Input -->
				<div class="space-y-1.5">
					<Label for="email" class="text-xs font-semibold text-foreground">Alamat Email</Label>
					<div class="relative">
						<Mail
							class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
						/>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							autocapitalize="none"
							autocorrect="off"
							enterkeyhint="next"
							placeholder="nama@email.com"
							required
							value={form?.email || ''}
							class="h-10 pl-9.5 text-sm"
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<Label for="password" class="text-xs font-semibold text-foreground">Kata Sandi</Label>
						<a
							href="#bantuan"
							class="text-[11px] font-medium text-primary transition-colors hover:underline"
						>
							Lupa sandi?
						</a>
					</div>
					<div class="relative">
						<Lock
							class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
						/>
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							autocapitalize="none"
							autocorrect="off"
							enterkeyhint="done"
							placeholder="Masukkan kata sandi Anda"
							required
							class="h-10 pr-10 pl-9.5 text-sm"
						/>
						<button
							type="button"
							class="absolute top-2.5 right-3 text-muted-foreground transition-colors hover:text-foreground"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
						>
							{#if showPassword}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit Button -->
				<Button
					type="submit"
					class="mt-2 h-10 w-full font-semibold shadow-xs transition-transform active:scale-[0.99]"
					disabled={loading}
				>
					{#if loading}
						<span
							class="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
						></span>
						<span>Memverifikasi...</span>
					{:else}
						<span>Masuk Sekarang</span>
						<ArrowRight class="ml-1.5 size-4" />
					{/if}
				</Button>
			</form>

			<!-- Switch to Register -->
			<div class="mt-8 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">
				<p>
					Belum memiliki akun Titipin?
					<a
						href={resolve('/daftar')}
						class="font-semibold text-primary transition-colors hover:underline"
					>
						Daftar akun baru di sini
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
