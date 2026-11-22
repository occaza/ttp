<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { ShieldAlert, Users, Store, ShoppingBag } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Panel Admin - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 px-4 py-8">
	<div class="flex items-center justify-between">
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
			>
				<ShieldAlert class="size-3.5" />
				<span>Akses Terlindungi: Administrator</span>
			</div>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground">Panel Administrasi</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Masuk sebagai: {data.user?.email} ({data.profile?.full_name})
			</p>
		</div>

		<Button variant="outline" size="sm" href={resolve('/profil')}>Kembali ke Profil</Button>
	</div>

	<!-- Stats Overview Placeholders for Admin -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Total Pengguna</CardTitle>
				<Users class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">Akses Terproteksi</div>
				<p class="text-[11px] text-muted-foreground">Otorisasi server-side berhasil</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Mitra Jasa</CardTitle>
				<Store class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">Role Verified</div>
				<p class="text-[11px] text-muted-foreground">Provider profiles terisolasi</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Pesanan Sistem</CardTitle>
				<ShoppingBag class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">Phase 2 Active</div>
				<p class="text-[11px] text-muted-foreground">Fondasi auth & peran siap</p>
			</CardContent>
		</Card>
	</div>
</div>
