<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.js';
	import { Store, ShieldCheck, CheckCircle2, Clock } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard Mitra - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 px-4 py-8">
	<div class="flex items-center justify-between">
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
			>
				<Store class="size-3.5" />
				<span>Dashboard Mitra Penyedia Jasa</span>
			</div>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground">Area Kerja Mitra</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Kelola layanan dan ketersediaan jastip Anda
			</p>
		</div>

		<Button variant="outline" size="sm" href={resolve('/profil')}>Profil Saya</Button>
	</div>

	<!-- Status Mitra Card -->
	<Card class="border-border/80">
		<CardHeader>
			<CardTitle class="text-base font-bold">Status Keanggotaan Mitra</CardTitle>
			<CardDescription class="text-xs">
				Identitas dan validitas status operasional mitra lokal
			</CardDescription>
		</CardHeader>
		<CardContent class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
			<div class="rounded-lg bg-muted/40 p-3">
				<span class="block text-[11px] text-muted-foreground">Nama Bisnis / Layanan</span>
				<span class="font-bold text-foreground">
					{data.providerProfile?.business_name || data.profile?.full_name || 'Mitra Titipin'}
				</span>
			</div>
			<div class="rounded-lg bg-muted/40 p-3">
				<span class="block text-[11px] text-muted-foreground">Status Verifikasi</span>
				<span class="inline-flex items-center gap-1 font-semibold text-primary">
					<CheckCircle2 class="size-3.5" />
					{data.providerProfile?.is_verified ? 'Terverifikasi' : 'Tahap Pilot Terdaftar'}
				</span>
			</div>
			<div class="rounded-lg bg-muted/40 p-3">
				<span class="block text-[11px] text-muted-foreground">Ketersediaan</span>
				<span class="inline-flex items-center gap-1 font-semibold text-foreground">
					<Clock class="size-3.5 text-primary" />
					{data.providerProfile?.is_active ? 'Siap Menerima Order' : 'Non-aktif'}
				</span>
			</div>
		</CardContent>
	</Card>

	<!-- Note for Next Phase -->
	<div
		class="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground"
	>
		<ShieldCheck class="size-5 shrink-0 text-primary" />
		<p>
			Otorisasi server-side untuk peran <strong>Provider</strong> berhasil dikonfigurasi. Fitur
			manajemen listing layanan dan area jangkauan akan diimplementasikan pada
			<strong>Phase 4</strong>.
		</p>
	</div>
</div>
