<script lang="ts">
	import {
		Bold,
		Heading2,
		Heading3,
		Image as ImageIcon,
		Italic,
		Link2,
		List,
		ListOrdered,
		Quote,
		RemoveFormatting
	} from 'lucide-svelte';

	let {
		id,
		name,
		value = $bindable(''),
		placeholder = 'Tulis isi artikel atau halaman di sini...',
		mediaUrls = []
	}: {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		mediaUrls?: { file_name: string; public_url: string }[];
	} = $props();

	let editorEl = $state<HTMLDivElement | null>(null);
	let showLinkBar = $state(false);
	let linkUrl = $state('https://');
	let showImageBar = $state(false);
	let imageUrl = $state('');

	function syncValue() {
		if (editorEl) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			value = editorEl.innerHTML;
		}
	}

	function exec(command: string, arg?: string) {
		editorEl?.focus();
		document.execCommand(command, false, arg);
		syncValue();
	}

	function applyLink() {
		const trimmed = linkUrl.trim();
		if (trimmed && (trimmed.startsWith('https://') || trimmed.startsWith('/'))) {
			exec('createLink', trimmed);
		}
		showLinkBar = false;
		linkUrl = 'https://';
	}

	function insertImage(url: string) {
		const trimmed = url.trim();
		if (trimmed && (trimmed.startsWith('https://') || trimmed.startsWith('/'))) {
			exec(
				'insertHTML',
				`<img src="${trimmed}" alt="Gambar konten" class="my-3 max-h-80 rounded-xl border border-border/70 object-cover" />`
			);
		}
		showImageBar = false;
		imageUrl = '';
	}
</script>

<div class="overflow-hidden rounded-xl border border-input bg-background shadow-2xs">
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/30 p-1.5">
		<button
			type="button"
			onclick={() => exec('formatBlock', '<h2>')}
			aria-label="Judul Besar (H2)"
			title="Judul Besar (H2)"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Heading2 class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => exec('formatBlock', '<h3>')}
			aria-label="Subjudul (H3)"
			title="Subjudul (H3)"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Heading3 class="size-4" />
		</button>

		<span class="mx-0.5 h-5 w-px bg-border/80"></span>

		<button
			type="button"
			onclick={() => exec('bold')}
			aria-label="Tebal"
			title="Tebal"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Bold class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => exec('italic')}
			aria-label="Miring"
			title="Miring"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Italic class="size-4" />
		</button>

		<span class="mx-0.5 h-5 w-px bg-border/80"></span>

		<button
			type="button"
			onclick={() => exec('insertUnorderedList')}
			aria-label="Daftar Poin"
			title="Daftar Poin"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<List class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => exec('insertOrderedList')}
			aria-label="Daftar Bernomor"
			title="Daftar Bernomor"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<ListOrdered class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => exec('formatBlock', '<blockquote>')}
			aria-label="Kutipan"
			title="Kutipan"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Quote class="size-4" />
		</button>

		<span class="mx-0.5 h-5 w-px bg-border/80"></span>

		<button
			type="button"
			onclick={() => {
				showLinkBar = !showLinkBar;
				showImageBar = false;
			}}
			aria-label="Sisipkan Tautan"
			title="Sisipkan Tautan"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<Link2 class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => {
				showImageBar = !showImageBar;
				showLinkBar = false;
			}}
			aria-label="Sisipkan Gambar"
			title="Sisipkan Gambar"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<ImageIcon class="size-4" />
		</button>
		<button
			type="button"
			onclick={() => exec('removeFormat')}
			aria-label="Bersihkan Format"
			title="Bersihkan Format"
			class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<RemoveFormatting class="size-4" />
		</button>
	</div>

	{#if showLinkBar}
		<div class="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/20 p-2">
			<input
				type="url"
				bind:value={linkUrl}
				placeholder="https://... atau /pesan"
				class="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-base sm:text-xs"
			/>
			<button
				type="button"
				onclick={applyLink}
				class="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
			>
				Pasang Link
			</button>
		</div>
	{/if}

	{#if showImageBar}
		<div class="space-y-2 border-b border-border/70 bg-muted/20 p-2.5">
			<div class="flex flex-wrap items-center gap-2">
				<input
					type="url"
					bind:value={imageUrl}
					placeholder="Tempel URL gambar (https://...)"
					class="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-base sm:text-xs"
				/>
				<button
					type="button"
					onclick={() => insertImage(imageUrl)}
					class="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
				>
					Sisipkan
				</button>
			</div>
			{#if mediaUrls.length > 0}
				<div class="space-y-1.5">
					<p class="text-[11px] font-medium text-muted-foreground">Pilih dari Media Manager:</p>
					<div class="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
						{#each mediaUrls as m (m.public_url)}
							<button
								type="button"
								onclick={() => insertImage(m.public_url)}
								class="group overflow-hidden rounded-lg border border-border/70 bg-background text-left transition-colors hover:border-primary"
								title={m.file_name}
							>
								<img
									src={m.public_url}
									alt={m.file_name}
									class="h-14 w-full object-cover"
									loading="lazy"
								/>
								<span
									class="block truncate px-1.5 py-1 text-[10px] text-muted-foreground group-hover:text-primary"
								>
									{m.file_name}
								</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Editable Surface -->
	<div
		{id}
		bind:this={editorEl}
		bind:innerHTML={value}
		contenteditable="true"
		role="textbox"
		aria-multiline="true"
		tabindex="0"
		data-placeholder={placeholder}
		oninput={syncValue}
		class="rich-editor min-h-60 p-4 text-sm leading-relaxed text-foreground focus:outline-none"
	></div>
</div>

<style>
	.rich-editor:empty::before {
		content: attr(data-placeholder);
		color: var(--muted-foreground);
		pointer-events: none;
	}
	.rich-editor :global(h2) {
		font-size: 1.125rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	.rich-editor :global(h3) {
		font-size: 1rem;
		font-weight: 700;
		margin-top: 0.75rem;
		margin-bottom: 0.375rem;
	}
	.rich-editor :global(ul) {
		list-style-type: disc;
		padding-left: 1.25rem;
		margin: 0.5rem 0;
	}
	.rich-editor :global(ol) {
		list-style-type: decimal;
		padding-left: 1.25rem;
		margin: 0.5rem 0;
	}
	.rich-editor :global(blockquote) {
		border-left: 2px solid var(--primary);
		padding-left: 0.75rem;
		margin: 0.5rem 0;
		color: var(--muted-foreground);
	}
	.rich-editor :global(a) {
		color: var(--primary);
		text-decoration: underline;
	}
</style>
