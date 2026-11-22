<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.js';
	import { User, Mail, Phone, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Profil Saya - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 py-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Profil Akun</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Informasi akun dan hak akses Anda di Titipin
			</p>
		</div>

		<form method="POST" action={resolve('/keluar')}>
			<Button variant="outline" size="sm" type="submit" class="gap-1.5 text-xs">
				<LogOut class="size-3.5" />
				<span>Keluar</span>
			</Button>
		</form>
	</div>

	<!-- Profile Card -->
	<Card class="border-border/80 shadow-xs">
		<CardHeader>
			<div class="flex items-center gap-3.5">
				<div
					class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary"
				>
					{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
				</div>
				<div>
					<CardTitle class="text-lg font-bold">{data.profile?.full_name || 'Pengguna'}</CardTitle>
					<CardDescription class="flex items-center gap-2 text-xs">
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold {data.role ===
							'admin'
								? 'bg-destructive/10 text-destructive'
								: data.role === 'provider'
									? 'bg-primary/15 text-primary'
									: 'bg-muted text-foreground'}"
						>
							<ShieldCheck class="size-3" />
							Peran: {data.role?.toUpperCase() || 'CUSTOMER'}
						</span>
					</CardDescription>
				</div>
			</div>
		</CardHeader>

		<CardContent class="space-y-3.5 pt-2 text-xs sm:text-sm">
			<div class="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
				<Mail class="size-4 text-muted-foreground" />
				<div>
					<span class="block text-[11px] text-muted-foreground">Email Terdaftar</span>
					<span class="font-medium text-foreground">{data.user?.email}</span>
				</div>
			</div>

			<div class="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
				<Phone class="size-4 text-muted-foreground" />
				<div>
					<span class="block text-[11px] text-muted-foreground">Nomor Telepon</span>
					<span class="font-medium text-foreground">
						{data.profile?.phone || 'Belum ditambahkan'}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
				<User class="size-4 text-muted-foreground" />
				<div>
					<span class="block text-[11px] text-muted-foreground">ID Pengguna</span>
					<span class="font-mono text-xs text-muted-foreground">{data.user?.id}</span>
				</div>
			</div>

			{#if data.role === 'provider' || data.role === 'admin'}
				<div class="mt-4 border-t border-border/70 pt-4">
					<Button href={resolve('/mitra/dashboard')} class="w-full gap-2">
						<LayoutDashboard class="size-4" />
						<span>Buka Dashboard Mitra</span>
					</Button>
				</div>
			{/if}

			{#if data.role === 'admin'}
				<div class="mt-2">
					<Button variant="outline" href={resolve('/admin')} class="w-full gap-2 text-destructive">
						<ShieldCheck class="size-4" />
						<span>Buka Panel Admin</span>
					</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
