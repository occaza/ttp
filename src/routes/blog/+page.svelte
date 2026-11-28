<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { ArrowRight, BookOpen, Calendar } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Blog &amp; Kabar Titipin</title>
	<meta
		name="description"
		content="Artikel, panduan titip belanja, dan informasi layanan Titipin di area Gatak dan Kartasura."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Blog & Kabar Titipin" />
	<meta
		property="og:description"
		content="Artikel, panduan titip belanja, dan informasi layanan Titipin di area Gatak dan Kartasura."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
	<header class="border-b border-border/60 pb-5">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Blog &amp; Kabar</h1>
		<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
			Informasi layanan, pembaruan area operasional, dan catatan seputar Titipin.
		</p>
	</header>

	{#if data.posts.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-14 text-center"
		>
			<BookOpen class="size-7 text-muted-foreground/60" />
			<p class="mt-3 text-sm font-semibold text-foreground">Belum ada artikel yang diterbitkan</p>
			<p class="mt-1 max-w-sm text-xs text-muted-foreground">
				Artikel dan informasi terbaru dari Titipin akan muncul di halaman ini.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.posts as post (post.id)}
				<a
					href={resolve('/blog/[slug]', { slug: post.slug })}
					class="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-colors duration-150 hover:border-primary/50"
				>
					{#if post.cover_image_url}
						<img
							src={post.cover_image_url}
							alt={post.title}
							class="h-44 w-full object-cover"
							loading="lazy"
						/>
					{/if}
					<div class="flex flex-1 flex-col justify-between p-5">
						<div class="space-y-2">
							<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
								<Calendar class="size-3.5" />
								<span>
									{new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</span>
							</div>
							<h2 class="text-base font-bold text-foreground group-hover:text-primary">
								{post.title}
							</h2>
							{#if post.excerpt}
								<p class="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
									{post.excerpt}
								</p>
							{/if}
						</div>

						<div class="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
							<span>Baca selengkapnya</span>
							<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
