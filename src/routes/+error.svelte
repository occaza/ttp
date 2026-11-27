<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { AlertTriangle, ArrowLeft, Home } from 'lucide-svelte';

	const status = $derived(page.status || 500);
	const message = $derived(
		page.error?.message ||
			(status === 404
				? 'Halaman yang Anda cari tidak ditemukan.'
				: status === 403
					? 'Anda tidak memiliki izin untuk mengakses halaman ini.'
					: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.')
	);
</script>

<svelte:head>
	<title>{status} - Titipin</title>
</svelte:head>

<main
	class="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center"
>
	<div
		class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
	>
		<AlertTriangle class="size-7" />
	</div>
	<p class="text-xs font-bold tracking-wider text-muted-foreground uppercase">Error {status}</p>
	<h1 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
		{status === 404
			? 'Halaman Tidak Ditemukan'
			: status === 403
				? 'Akses Dibatasi'
				: 'Terjadi Kendala'}
	</h1>
	<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

	<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
		<Button variant="outline" size="sm" onclick={() => history.back()} class="gap-1.5 text-xs">
			<ArrowLeft class="size-3.5" />
			<span>Kembali</span>
		</Button>
		<Button href={resolve('/')} size="sm" class="gap-1.5 text-xs font-bold">
			<Home class="size-3.5" />
			<span>Ke Beranda</span>
		</Button>
	</div>
</main>
