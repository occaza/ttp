<script lang="ts">
	import type { ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.js';
	import {
		Lock,
		Mail,
		User,
		Phone,
		AlertCircle,
		ArrowRight,
		ShieldCheck,
		ShoppingBag
	} from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let selectedRole = $state<'customer' | 'provider'>('customer');
</script>

<svelte:head>
	<title>Daftar Akun - Titipin</title>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100vh-14rem)] max-w-lg items-center justify-center px-4 py-8">
	<Card class="w-full border-border/80 shadow-md">
		<CardHeader class="space-y-1 text-center">
			<CardTitle class="text-2xl font-bold tracking-tight">Buat Akun Baru</CardTitle>
			<CardDescription class="text-xs sm:text-sm">
				Bergabung ke Titipin sebagai Pelanggan atau Mitra Penyedia Jasa
			</CardDescription>
		</CardHeader>

		<CardContent>
			{#if form?.error}
				<div
					class="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
					role="alert"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}

			<form
				method="POST"
				class="space-y-4"
				onsubmit={() => {
					loading = true;
				}}
			>
				<!-- Role Selector -->
				<div class="space-y-1.5">
					<Label class="text-xs font-semibold">Daftar Sebagai</Label>
					<div class="grid grid-cols-2 gap-3">
						<label
							class="flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 transition-all {selectedRole ===
							'customer'
								? 'border-primary bg-primary/5 text-primary shadow-xs'
								: 'border-border/80 hover:border-border'}"
						>
							<input
								type="radio"
								name="role"
								value="customer"
								checked={selectedRole === 'customer'}
								onchange={() => (selectedRole = 'customer')}
								class="sr-only"
							/>
							<ShoppingBag class="mb-1 size-5" />
							<span class="text-xs font-bold text-foreground">Pelanggan</span>
							<span class="mt-0.5 text-center text-[11px] text-muted-foreground">
								Titip & pesan jasa
							</span>
						</label>

						<label
							class="flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 transition-all {selectedRole ===
							'provider'
								? 'border-primary bg-primary/5 text-primary shadow-xs'
								: 'border-border/80 hover:border-border'}"
						>
							<input
								type="radio"
								name="role"
								value="provider"
								checked={selectedRole === 'provider'}
								onchange={() => (selectedRole = 'provider')}
								class="sr-only"
							/>
							<ShieldCheck class="mb-1 size-5" />
							<span class="text-xs font-bold text-foreground">Mitra Jasa</span>
							<span class="mt-0.5 text-center text-[11px] text-muted-foreground">
								Sedia layanan titip
							</span>
						</label>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="full_name" class="text-xs font-semibold">Nama Lengkap</Label>
					<div class="relative">
						<User class="absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="full_name"
							name="full_name"
							type="text"
							placeholder="Nama Lengkap Anda"
							required
							value={form?.full_name || ''}
							class="pl-9"
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="email" class="text-xs font-semibold">Alamat Email</Label>
					<div class="relative">
						<Mail class="absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="nama@email.com"
							required
							value={form?.email || ''}
							class="pl-9"
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="phone" class="text-xs font-semibold">Nomor WhatsApp / HP</Label>
					<div class="relative">
						<Phone class="absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="phone"
							name="phone"
							type="tel"
							placeholder="08123456789"
							value={form?.phone || ''}
							class="pl-9"
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="password" class="text-xs font-semibold">Kata Sandi</Label>
					<div class="relative">
						<Lock class="absolute top-2.5 left-3 size-4 text-muted-foreground" />
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Minimal 6 karakter"
							required
							class="pl-9"
						/>
					</div>
				</div>

				<Button type="submit" class="w-full font-semibold shadow-sm" disabled={loading}>
					{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
					<ArrowRight class="ml-1.5 size-4" />
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex flex-col gap-2 border-t border-border/60 pt-4 text-center text-xs">
			<p class="text-muted-foreground">
				Sudah memiliki akun?
				<a href={resolve('/masuk')} class="font-semibold text-primary hover:underline">
					Masuk di sini
				</a>
			</p>
		</CardFooter>
	</Card>
</div>
