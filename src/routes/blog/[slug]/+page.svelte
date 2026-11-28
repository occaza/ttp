<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { renderCmsContentToHtml } from '#lib/utils/markdown.js';
	import { ArrowLeft, Calendar } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const bodyHtml = $derived(renderCmsContentToHtml(data.post.body));
</script>

<svelte:head>
	<title>{data.post.title} - Blog Titipin</title>
	<meta name="description" content={data.post.excerpt || `${data.post.title} - Artikel Titipin`} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.title} />
	<meta
		property="og:description"
		content={data.post.excerpt || `${data.post.title} - Artikel Titipin`}
	/>
	{#if data.post.cover_image_url}
		<meta property="og:image" content={data.post.cover_image_url} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={data.post.cover_image_url} />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	<meta name="twitter:title" content={data.post.title} />
	<meta
		name="twitter:description"
		content={data.post.excerpt || `${data.post.title} - Artikel Titipin`}
	/>
</svelte:head>

<article class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
	<a
		href={resolve('/blog')}
		class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft class="size-3.5" />
		<span>Kembali ke Blog</span>
	</a>

	<header class="space-y-3 border-b border-border/60 pb-5">
		<div class="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
			<Calendar class="size-3.5" />
			<span>
				{new Date(data.post.published_at || data.post.created_at).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})}
			</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			{data.post.title}
		</h1>
		{#if data.post.excerpt}
			<p class="text-sm leading-relaxed text-muted-foreground">{data.post.excerpt}</p>
		{/if}
	</header>

	{#if data.post.cover_image_url}
		<img
			src={data.post.cover_image_url}
			alt={data.post.title}
			class="max-h-96 w-full rounded-2xl border border-border/70 object-cover"
		/>
	{/if}

	<div
		class="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:bg-muted/40 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html bodyHtml}
	</div>
</article>
