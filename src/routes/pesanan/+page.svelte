<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { ORDER_STATUS_LABELS } from '#lib/constants/order.js';
	import { ShoppingBag, Clock, MapPin, ChevronRight, ArrowRight } from 'lucide-svelte';
	import { Button } from '#lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Daftar Pesanan Jastip Saya - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Page Header -->
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center"
	>
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
			>
				<ShoppingBag class="size-3.5" />
				<span>Riwayat & Status Pesanan</span>
			</div>
			<h1 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Pesanan Jastip Saya
			</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Pantau proses belanja dan pengantaran pesanan Anda secara langsung.
			</p>
		</div>

		<Button href={resolve('/pesan')} class="h-10 gap-1.5 rounded-xl text-xs font-bold shadow-xs">
			<span>Buat Pesanan Baru</span>
			<ArrowRight class="size-3.5" />
		</Button>
	</div>

	{#if data.orders.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center"
		>
			<div
				class="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground"
			>
				<ShoppingBag class="size-7" />
			</div>
			<h2 class="mt-4 text-base font-bold text-foreground">Belum Ada Pesanan Aktif</h2>
			<p class="mt-1 max-w-sm text-xs text-muted-foreground">
				Anda belum memiliki pesanan jastip. Cari warung, pasar, atau toko lokal favorit Anda di
				Gatak.
			</p>
			<Button href={resolve('/layanan')} class="mt-5 text-xs font-bold">
				Jelajahi Katalog Layanan
			</Button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.orders as order (order.id)}
				{@const statusMeta = ORDER_STATUS_LABELS[order.status] || {
					label: order.status,
					badgeClass: 'bg-muted text-muted-foreground'
				}}
				<a
					href={resolve('/pesanan/[id]', { id: order.id })}
					class="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:p-6"
				>
					<div
						class="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex items-center gap-2.5">
							<span class="font-mono text-xs font-bold text-foreground">
								{order.order_number}
							</span>
							<span
								class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold {statusMeta.badgeClass}"
							>
								{statusMeta.label}
							</span>
						</div>

						<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Clock class="size-3.5" />
							<span>
								{new Date(order.created_at).toLocaleDateString('id-ID', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					</div>

					<div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div class="space-y-1">
							<h2
								class="text-sm font-bold text-foreground transition-colors group-hover:text-primary"
							>
								{order.origin_name}
							</h2>
							<div class="flex items-center gap-1 text-xs text-muted-foreground">
								<MapPin class="size-3.5 shrink-0 text-primary" />
								<span class="max-w-xs truncate">{order.destination_address_text}</span>
							</div>
							<p class="text-[11px] text-muted-foreground">
								{order.items.length} Barang Belanjaan
							</p>
						</div>

						<div
							class="flex items-center justify-between gap-4 border-t border-border/40 pt-3 sm:border-0 sm:pt-0"
						>
							<div class="text-left sm:text-right">
								<span class="block text-[10px] text-muted-foreground">Total Estimasi</span>
								<span class="text-sm font-black text-primary">
									Rp {Number(order.total_estimated).toLocaleString('id-ID')}
								</span>
							</div>

							<div
								class="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
							>
								<ChevronRight class="size-4" />
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
