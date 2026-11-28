<script lang="ts">
	import type { PageData } from './$types';
	import { renderCmsContentToHtml } from '#lib/utils/markdown.js';

	let { data }: { data: PageData } = $props();

	const bodyHtml = $derived(renderCmsContentToHtml(data.page.body));
</script>

<svelte:head>
	<title>{data.page.title} - Titipin</title>
	<meta name="description" content={data.page.excerpt || `${data.page.title} - Titipin`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.excerpt || `${data.page.title} - Titipin`} />
	{#if data.page.cover_image_url}
		<meta property="og:image" content={data.page.cover_image_url} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={data.page.cover_image_url} />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	<meta name="twitter:title" content={data.page.title} />
	<meta name="twitter:description" content={data.page.excerpt || `${data.page.title} - Titipin`} />
</svelte:head>

<article class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
	<header class="space-y-2 border-b border-border/60 pb-5">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			{data.page.title}
		</h1>
		{#if data.page.excerpt}
			<p class="text-sm text-muted-foreground">{data.page.excerpt}</p>
		{/if}
		<p class="text-[11px] text-muted-foreground tabular-nums">
			Diperbarui {new Date(data.page.updated_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})}
		</p>
	</header>

	{#if data.page.cover_image_url}
		<img
			src={data.page.cover_image_url}
			alt={data.page.title}
			class="max-h-80 w-full rounded-2xl border border-border/70 object-cover"
		/>
	{/if}

	<div
		class="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:bg-muted/40 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html bodyHtml}
	</div>
</article>
