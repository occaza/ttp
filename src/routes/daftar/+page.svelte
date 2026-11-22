<script lang="ts">
	import type { ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import {
		Lock,
		Mail,
		User,
		Phone,
		AlertCircle,
		ArrowRight,
		Eye,
		EyeOff,
		CheckCircle2,
		ShieldCheck,
		ShoppingBag,
		ArrowLeft,
		Sparkles,
		BadgePercent
	} from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let selectedRole = $state<'customer' | 'provider'>('customer');

	$effect(() => {
		if (form?.role === 'customer' || form?.role === 'provider') {
			selectedRole = form.role;
		}
	});
</script>

<svelte:head>
	<title>Daftar Akun Baru - Titipin</title>
	<meta
		name="description"
		content="Daftar akun Titipin sebagai Pelanggan untuk titip belanja lokal atau sebagai Mitra untuk penghasilan tambahan."
	/>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6">
	<div class="grid w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg md:grid-cols-12">
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
					<div class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
						<Sparkles class="size-3.5 text-amber-300" />
						<span>Registrasi Cepat & Praktis</span>
					</div>
					<h2 class="mt-4 text-2xl font-black tracking-tight text-white lg:text-3xl">
						{#if selectedRole === 'customer'}
							Satu akun untuk semua kebutuhan titip belanja lokal Anda.
						{:else}
							Dapatkan penghasilan tambahan dari rute belanja harian Anda.
						{/if}
					</h2>
				</div>
			</div>

			<!-- Dynamic Role Feature Card -->
			<div class="relative z-10 my-6 rounded-xl border border-white/20 bg-white/10 p-4.5 backdrop-blur-md">
				{#if selectedRole === 'customer'}
					<div class="flex items-center gap-2 text-xs font-bold text-white">
						<ShoppingBag class="size-4 text-emerald-300" />
						<span>Keuntungan Pelanggan</span>
					</div>
					<ul class="mt-3 space-y-2 text-xs text-white/90">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
							<span>Bisa titip ke warung gang atau resto tanpa ojol</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
							<span>Harga barang sesuai struk kasir toko (tanpa markup)</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
							<span>Bebas beri catatan spesifik belanjaan</span>
						</li>
					</ul>
				{:else}
					<div class="flex items-center gap-2 text-xs font-bold text-white">
						<BadgePercent class="size-4 text-amber-300" />
						<span>Keuntungan Mitra Jastip</span>
					</div>
					<ul class="mt-3 space-y-2 text-xs text-white/90">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-amber-300" />
							<span>Komisi tarif jasa titip 100% transparan</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-amber-300" />
							<span>Fleksibel, ambil pesanan searah rute Anda</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-amber-300" />
							<span>Terhubung langsung dengan pelanggan area lokal</span>
						</li>
					</ul>
				{/if}
			</div>

			<!-- Bottom Trust Highlights -->
			<div class="relative z-10 space-y-2 border-t border-white/15 pt-5 text-xs text-primary-foreground/90">
				<div class="flex items-center gap-2">
					<ShieldCheck class="size-4 shrink-0 text-emerald-300" />
					<span>Privasi dan data kontak tersimpan aman</span>
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
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
					T
				</div>
			</div>

			<div class="space-y-1.5">
				<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Buat Akun Baru
				</h1>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Pilih peran Anda dan lengkapi data singkat untuk memulai.
				</p>
			</div>

			{#if form?.error}
				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
					role="alert"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0" />
					<div>
						<p class="font-semibold">Gagal mendaftar</p>
						<p class="mt-0.5">{form.error}</p>
					</div>
				</div>
			{/if}

			<form
				method="POST"
				class="mt-5 space-y-4"
				onsubmit={() => {
					loading = true;
				}}
			>
				<!-- Role Selector Buttons -->
				<div class="space-y-1.5">
					<Label class="text-xs font-semibold text-foreground">Daftar Sebagai</Label>
					<div class="grid grid-cols-2 gap-2.5">
						<label
							class="flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all {selectedRole ===
							'customer'
								? 'border-primary bg-primary/5 ring-1 ring-primary/40'
								: 'border-border/80 hover:border-border hover:bg-muted/30'}"
						>
							<input
								type="radio"
								name="role"
								value="customer"
								checked={selectedRole === 'customer'}
								onchange={() => (selectedRole = 'customer')}
								class="sr-only"
							/>
							<div class="flex items-center justify-between">
								<ShoppingBag class="size-4.5 {selectedRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}" />
								{#if selectedRole === 'customer'}
									<span class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Dipilih</span>
								{/if}
							</div>
							<span class="mt-2 text-xs font-bold text-foreground">Pelanggan</span>
							<span class="mt-0.5 text-[11px] text-muted-foreground">
								Titip belanja & kebutuhan harian
							</span>
						</label>

						<label
							class="flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all {selectedRole ===
							'provider'
								? 'border-primary bg-primary/5 ring-1 ring-primary/40'
								: 'border-border/80 hover:border-border hover:bg-muted/30'}"
						>
							<input
								type="radio"
								name="role"
								value="provider"
								checked={selectedRole === 'provider'}
								onchange={() => (selectedRole = 'provider')}
								class="sr-only"
							/>
							<div class="flex items-center justify-between">
								<ShieldCheck class="size-4.5 {selectedRole === 'provider' ? 'text-primary' : 'text-muted-foreground'}" />
								{#if selectedRole === 'provider'}
									<span class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Dipilih</span>
								{/if}
							</div>
							<span class="mt-2 text-xs font-bold text-foreground">Mitra Jastip</span>
							<span class="mt-0.5 text-[11px] text-muted-foreground">
								Sediakan jasa & dapatkan komisi
							</span>
						</label>
					</div>
				</div>

				<!-- Full Name Input -->
				<div class="space-y-1.5">
					<Label for="full_name" class="text-xs font-semibold text-foreground">Nama Lengkap</Label>
					<div class="relative">
						<User class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="full_name"
							name="full_name"
							type="text"
							autocomplete="name"
							enterkeyhint="next"
							placeholder="Contoh: Budi Santoso"
							required
							value={form?.full_name || ''}
							class="h-10 pl-9.5 text-sm"
						/>
					</div>
				</div>

				<!-- Email Input -->
				<div class="space-y-1.5">
					<Label for="email" class="text-xs font-semibold text-foreground">Alamat Email</Label>
					<div class="relative">
						<Mail class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
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

				<!-- Phone Input -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<Label for="phone" class="text-xs font-semibold text-foreground">Nomor WhatsApp / HP</Label>
						<span class="text-[11px] text-muted-foreground">Aktif untuk koordinasi</span>
					</div>
					<div class="relative">
						<Phone class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="phone"
							name="phone"
							type="tel"
							inputmode="tel"
							autocomplete="tel"
							enterkeyhint="next"
							placeholder="08123456789"
							value={form?.phone || ''}
							class="h-10 pl-9.5 text-sm"
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div class="space-y-1.5">
					<Label for="password" class="text-xs font-semibold text-foreground">Kata Sandi</Label>
					<div class="relative">
						<Lock class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							autocapitalize="none"
							autocorrect="off"
							enterkeyhint="done"
							placeholder="Minimal 6 karakter"
							required
							class="h-10 pl-9.5 pr-10 text-sm"
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
						<span class="inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></span>
						<span>Membuat akun...</span>
					{:else}
						<span>Daftar Sebagai {selectedRole === 'customer' ? 'Pelanggan' : 'Mitra'}</span>
						<ArrowRight class="ml-1.5 size-4" />
					{/if}
				</Button>
			</form>

			<!-- Switch to Login -->
			<div class="mt-6 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
				<p>
					Sudah memiliki akun Titipin?
					<a
						href={resolve('/masuk')}
						class="font-semibold text-primary transition-colors hover:underline"
					>
						Masuk di sini
					</a>
				</p>
			</div>
		</div>
	</div>
</div>