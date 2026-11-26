<script lang="ts">
	import type { ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import {
		Mail,
		AlertCircle,
		ArrowRight,
		CheckCircle2,
		ShieldCheck,
		ArrowLeft,
		KeyRound
	} from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Lupa Kata Sandi - Titipin</title>
	<meta
		name="description"
		content="Pulihkan akses ke akun Titipin Anda melalui tautan pengaturan ulang kata sandi yang dikirim ke email."
	/>
</svelte:head>

<div
	class="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6"
>
	<div
		class="grid w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg md:grid-cols-12"
	>
		<!-- Left Visual Panel -->
		<div
			class="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:col-span-5 md:flex lg:p-10"
		>
			<div class="relative z-10 space-y-4">
				<a
					href={resolve('/masuk')}
					class="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/90 transition-opacity hover:opacity-100"
				>
					<ArrowLeft class="size-4" />
					<span>Kembali ke Halaman Masuk</span>
				</a>
				<div class="pt-4">
					<div
						class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs"
					>
						<KeyRound class="size-3.5 text-amber-300" />
						<span>Pemulihan Akun Aman</span>
					</div>
					<h2 class="mt-4 text-2xl font-black tracking-tight text-white lg:text-3xl">
						Akses akun Anda kembali dengan langkah verifikasi cepat.
					</h2>
					<p class="mt-3 text-xs leading-relaxed text-white/85">
						Tautan pemulihan akan dikirimkan langsung ke email Anda untuk membuat kata sandi baru.
					</p>
				</div>
			</div>

			<div
				class="relative z-10 space-y-2 border-t border-white/15 pt-5 text-xs text-primary-foreground/90"
			>
				<div class="flex items-center gap-2">
					<ShieldCheck class="size-4 shrink-0 text-emerald-300" />
					<span>Tautan kedaluwarsa otomatis dalam 60 menit untuk keamanan</span>
				</div>
			</div>
		</div>

		<!-- Right Form Column -->
		<div class="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 lg:p-10">
			<!-- Mobile Back Button -->
			<div class="mb-6 flex items-center justify-between md:hidden">
				<a
					href={resolve('/masuk')}
					class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft class="size-4" />
					<span>Kembali ke Masuk</span>
				</a>
				<div
					class="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground"
				>
					T
				</div>
			</div>

			<div class="space-y-2">
				<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Lupa Kata Sandi
				</h1>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Masukkan alamat email yang terdaftar pada akun Titipin Anda.
				</p>
			</div>

			{#if form?.success}
				<div
					class="mt-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-xs text-primary"
					role="status"
				>
					<CheckCircle2 class="mt-0.5 size-4 shrink-0" />
					<div>
						<p class="text-sm font-semibold">Tautan Pemulihan Terkirim</p>
						<p class="mt-1 leading-relaxed">
							Kami telah mengirim instruksi pengaturan ulang kata sandi ke <strong>
								{form.email}
							</strong>. Silakan periksa kotak masuk atau folder spam Anda.
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
						<p class="font-semibold">Gagal memproses permintaan</p>
						<p class="mt-0.5">{form.error}</p>
					</div>
				</div>
			{/if}

			{#if !form?.success}
				<form
					method="POST"
					class="mt-6 space-y-4"
					onsubmit={() => {
						loading = true;
					}}
				>
					<div class="space-y-1.5">
						<Label for="email" class="text-xs font-semibold text-foreground">
							Alamat Email Terdaftar
						</Label>
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
								enterkeyhint="send"
								placeholder="nama@email.com"
								required
								value={form?.email || ''}
								class="h-10 pl-9.5 text-sm"
							/>
						</div>
					</div>

					<Button
						type="submit"
						class="mt-2 h-10 w-full font-semibold shadow-xs transition-transform active:scale-[0.99]"
						disabled={loading}
					>
						{#if loading}
							<span
								class="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></span>
							<span>Mengirim Tautan...</span>
						{:else}
							<span>Kirim Tautan Pemulihan</span>
							<ArrowRight class="ml-1.5 size-4" />
						{/if}
					</Button>
				</form>
			{/if}

			<div class="mt-8 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">
				<p>
					Sudah ingat kata sandi Anda?
					<a
						href={resolve('/masuk')}
						class="font-semibold text-primary transition-colors hover:underline"
					>
						Masuk ke akun
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
