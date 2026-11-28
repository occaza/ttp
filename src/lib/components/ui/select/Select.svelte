<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { Check, ChevronDown } from 'lucide-svelte';

	export interface SelectOption {
		value: string;
		label: string;
	}

	let {
		id,
		name,
		value = $bindable(''),
		options,
		placeholder = 'Pilih opsi',
		disabled = false,
		class: className = '',
		triggerClass = '',
		onchange
	}: {
		id?: string;
		name?: string;
		value?: string;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		triggerClass?: string;
		onchange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let containerEl = $state<HTMLDivElement | null>(null);

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	function selectOption(nextValue: string) {
		value = nextValue;
		open = false;
		onchange?.(nextValue);
	}

	function handleWindowClick(e: MouseEvent) {
		if (open && containerEl && !containerEl.contains(e.target as Node)) {
			open = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				open = true;
			}
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
			return;
		}

		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (options.length === 0) return;
			const currentIdx = options.findIndex((o) => o.value === value);
			const delta = e.key === 'ArrowDown' ? 1 : -1;
			const nextIdx =
				currentIdx === -1 ? 0 : (currentIdx + delta + options.length) % options.length;
			const nextVal = options[nextIdx]?.value;
			if (nextVal !== undefined) {
				value = nextVal;
				onchange?.(nextVal);
			}
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div bind:this={containerEl} class={cn('relative w-full', className)}>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}

	<button
		{id}
		type="button"
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		onkeydown={handleKeydown}
		onclick={() => {
			if (!disabled) open = !open;
		}}
		class={cn(
			'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left text-base font-medium text-foreground shadow-2xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-xs',
			triggerClass
		)}
	>
		<span class={cn('truncate', !selectedOption && 'text-muted-foreground')}>
			{selectedOption ? selectedOption.label : placeholder}
		</span>
		<ChevronDown
			class={cn(
				'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
				open && 'rotate-180'
			)}
		/>
	</button>

	{#if open}
		<div
			role="listbox"
			tabindex="-1"
			onkeydown={handleKeydown}
			class="titipin-popover-enter absolute right-0 left-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg"
		>
			{#each options as opt (opt.value)}
				{@const isSelected = opt.value === value}
				<button
					type="button"
					role="option"
					aria-selected={isSelected}
					onclick={() => selectOption(opt.value)}
					class={cn(
						'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
						isSelected
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-popover-foreground hover:bg-muted'
					)}
				>
					<span class="truncate">{opt.label}</span>
					{#if isSelected}
						<Check class="size-3.5 shrink-0 text-primary" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
