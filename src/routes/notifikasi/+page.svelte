<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-svelte';
	import { Button } from '#lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();

	const unreadCount = $derived(data.notifications.filter((n) => !n.is_read).length);
</script>

<svelte:head>
	<title>Notifikasi - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center"
	>
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
			>
				<Bell class="size-3.5" />
				<span>Pusat Notifikasi</span>
			</div>
			<h1 class="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Notifikasi Anda
			</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Pembaruan status pesanan, chat, dan unggahan bukti struk kasir.
			</p>
		</div>

		{#if unreadCount > 0}
			<form method="POST" action="?/markAllRead" use:enhance>
				<Button type="submit" variant="outline" size="sm" class="h-9 gap-1.5 text-xs font-semibold">
					<CheckCheck class="size-3.5" />
					<span>Tandai Semua Dibaca ({unreadCount})</span>
				</Button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground"
			>
				<Bell class="size-6" />
			</div>
			<h2 class="mt-3 text-sm font-bold text-foreground">Belum Ada Notifikasi</h2>
			<p class="mt-1 max-w-sm text-xs text-muted-foreground">
				Informasi pembaruan pesanan dan pesan baru akan tampil di sini.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.notifications as notif (notif.id)}
				<div
					class="flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center {notif.is_read
						? 'border-border/60 bg-card/60 text-muted-foreground'
						: 'border-primary/40 bg-primary/5 text-foreground'}"
				>
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							{#if !notif.is_read}
								<span class="size-2 rounded-full bg-primary"></span>
							{/if}
							<h3 class="text-xs font-bold">{notif.title}</h3>
						</div>
						<p class="text-xs leading-relaxed text-muted-foreground">{notif.body}</p>
						<div class="flex items-center gap-1 text-[10px] text-muted-foreground">
							<Clock class="size-3" />
							<span>
								{new Date(notif.created_at).toLocaleDateString('id-ID', {
									day: 'numeric',
									month: 'short',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					</div>

					<div class="flex items-center gap-2 self-end sm:self-center">
						{#if !notif.is_read}
							<form method="POST" action="?/markRead" use:enhance>
								<input type="hidden" name="id" value={notif.id} />
								<Button type="submit" variant="ghost" size="sm" class="h-8 text-[11px]">
									Tandai Dibaca
								</Button>
							</form>
						{/if}

						{#if notif.order_id}
							<Button
								href={resolve('/pesanan/[id]', { id: notif.order_id })}
								size="sm"
								variant="outline"
								class="h-8 gap-1 text-[11px] font-semibold"
							>
								<span>Lihat Pesanan</span>
								<ArrowRight class="size-3" />
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
