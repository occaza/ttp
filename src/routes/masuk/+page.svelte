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
	import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Masuk - Titipin</title>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center px-4 py-8">
	<Card class="w-full border-border/80 shadow-md">
		<CardHeader class="space-y-1 text-center">
			<CardTitle class="text-2xl font-bold tracking-tight">Masuk ke Titipin</CardTitle>
			<CardDescription class="text-xs sm:text-sm">
				Gunakan akun terdaftar Anda untuk melanjutkan ke layanan
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
					<div class="flex items-center justify-between">
						<Label for="password" class="text-xs font-semibold">Kata Sandi</Label>
					</div>
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
					{loading ? 'Memproses...' : 'Masuk Sekarang'}
					<ArrowRight class="ml-1.5 size-4" />
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex flex-col gap-2 border-t border-border/60 pt-4 text-center text-xs">
			<p class="text-muted-foreground">
				Belum memiliki akun?
				<a href={resolve('/daftar')} class="font-semibold text-primary hover:underline">
					Daftar di sini
				</a>
			</p>
		</CardFooter>
	</Card>
</div>
