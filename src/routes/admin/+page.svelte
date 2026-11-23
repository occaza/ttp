<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { ServiceCategory } from '#lib/types/database.types.js';
	import {
		ShieldAlert,
		Users,
		Store,
		Layers,
		Plus,
		CheckCircle2,
		AlertCircle,
		Pencil,
		Trash2,
		Power
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isCategoryModalOpen = $state(false);
	let isSubmitting = $state(false);

	let editingCategory = $state<ServiceCategory | null>(null);

	function openAddCategoryModal() {
		editingCategory = null;
		isCategoryModalOpen = true;
	}

	function openEditCategoryModal(cat: ServiceCategory) {
		editingCategory = cat;
		isCategoryModalOpen = true;
	}
</script>

<svelte:head>
	<title>Panel Admin - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
	<!-- Top Bar -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
			>
				<ShieldAlert class="size-3.5" />
				<span>Akses Terlindungi: Administrator</span>
			</div>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground">Panel Administrasi</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Masuk sebagai: {data.user?.email} ({data.profile?.full_name || 'Admin'})
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" href={resolve('/profil')}>Ke Profil</Button>
			<Button size="sm" onclick={openAddCategoryModal} class="gap-1.5">
				<Plus class="size-4" />
				<span>Tambah Kategori</span>
			</Button>
		</div>
	</div>

	<!-- Form Feedback Message -->
	{#if form?.error}
		<div
			class="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}
	{#if form?.message}
		<div
			class="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-medium text-primary"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Overview Metrics -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Total Pengguna</CardTitle>
				<Users class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">Akses Terproteksi</div>
				<p class="text-[11px] text-muted-foreground">Admin role-based access control</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Mitra Terverifikasi</CardTitle>
				<Store class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">Role Verified</div>
				<p class="text-[11px] text-muted-foreground">Penyedia jasa terisolasi</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Total Kategori</CardTitle>
				<Layers class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-bold text-foreground">{data.categories.length} Kategori</div>
				<p class="text-[11px] text-muted-foreground">Phase 3: Service Categories Ready</p>
			</CardContent>
		</Card>
	</div>

	<!-- Category Management Section -->
	<Card>
		<CardHeader class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<CardTitle class="text-lg">Katalog Kategori Layanan</CardTitle>
				<p class="text-xs text-muted-foreground">
					Kelola kategori layanan publik untuk pelanggan dan mitra jastip.
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={openAddCategoryModal} class="gap-1.5 self-start">
				<Plus class="size-3.5" />
				<span>Kategori Baru</span>
			</Button>
		</CardHeader>
		<CardContent>
			<div class="divide-y divide-border/60 rounded-xl border border-border/80">
				{#each data.categories as cat (cat.id)}
					<div
						class="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
					>
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-bold text-foreground">{cat.name}</span>
								{#if cat.is_active}
									<Badge variant="default" class="text-[10px]">Aktif</Badge>
								{:else}
									<Badge variant="secondary" class="text-[10px]">Non-Aktif</Badge>
								{/if}
								<span class="text-[11px] text-muted-foreground">Urutan: #{cat.sort_order}</span>
							</div>
							<p class="text-xs text-muted-foreground">
								{cat.description || 'Tidak ada deskripsi'}
							</p>
							<div class="flex items-center gap-3 text-[11px] text-muted-foreground">
								<span>
									Slug: <code class="rounded bg-muted px-1 font-mono text-[10px]">{cat.slug}</code>
								</span>
								<span>
									Ikon: <code class="rounded bg-muted px-1 font-mono text-[10px]">
										{cat.icon || 'default'}
									</code>
								</span>
							</div>
						</div>

						<div class="flex items-center gap-2 self-end sm:self-center">
							<form
								method="POST"
								action="?/toggleCategoryActive"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ update }) => {
										await update();
										isSubmitting = false;
									};
								}}
							>
								<input type="hidden" name="id" value={cat.id} />
								<input type="hidden" name="current_status" value={String(cat.is_active)} />
								<Button
									type="submit"
									variant={cat.is_active ? 'outline' : 'secondary'}
									size="sm"
									disabled={isSubmitting}
									class="h-8 gap-1 px-2.5 text-xs"
								>
									<Power class="size-3.5" />
									<span>{cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
								</Button>
							</form>

							<Button
								variant="outline"
								size="sm"
								onclick={() => openEditCategoryModal(cat)}
								class="h-8 gap-1 px-2.5 text-xs"
							>
								<Pencil class="size-3.5" />
								<span>Edit</span>
							</Button>

							<form
								method="POST"
								action="?/deleteCategory"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ update }) => {
										await update();
										isSubmitting = false;
									};
								}}
							>
								<input type="hidden" name="id" value={cat.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									disabled={isSubmitting}
									class="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
									aria-label="Hapus Kategori"
								>
									<Trash2 class="size-3.5" />
								</Button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Add / Edit Category Dialog -->
<Dialog.Root bind:open={isCategoryModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-base font-bold">
				{editingCategory ? 'Edit Kategori Layanan' : 'Tambah Kategori Layanan Baru'}
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				Konfigurasi kategori layanan untuk ditampilkan di beranda dan halaman eksplorasi.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/saveCategory"
			class="space-y-4 pt-2"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					isCategoryModalOpen = false;
				};
			}}
		>
			{#if editingCategory}
				<input type="hidden" name="id" value={editingCategory.id} />
			{/if}

			<div class="space-y-1.5">
				<Label for="cat-name" class="text-xs font-semibold">Nama Kategori</Label>
				<Input
					id="cat-name"
					name="name"
					required
					value={editingCategory?.name ?? ''}
					placeholder="Contoh: Kuliner & Minuman"
					class="text-xs"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="cat-slug" class="text-xs font-semibold">Slug URL</Label>
				<Input
					id="cat-slug"
					name="slug"
					required
					value={editingCategory?.slug ?? ''}
					placeholder="contoh: food-beverage"
					class="text-xs"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="cat-desc" class="text-xs font-semibold">Deskripsi</Label>
				<Textarea
					id="cat-desc"
					name="description"
					rows={3}
					value={editingCategory?.description ?? ''}
					placeholder="Deskripsi singkat jenis titipan pada kategori ini"
					class="text-xs"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<Label for="cat-icon" class="text-xs font-semibold">Nama Ikon</Label>
					<Input
						id="cat-icon"
						name="icon"
						value={editingCategory?.icon ?? 'shopping-bag'}
						placeholder="utensils, store, carrot..."
						class="text-xs"
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="cat-sort" class="text-xs font-semibold">Urutan Tampil</Label>
					<Input
						id="cat-sort"
						type="number"
						name="sort_order"
						value={editingCategory?.sort_order ?? 0}
						class="text-xs"
					/>
				</div>
			</div>

			<div class="flex items-center gap-2 pt-2">
				<input
					type="checkbox"
					id="cat-active"
					name="is_active"
					checked={editingCategory ? editingCategory.is_active : true}
					class="size-4 rounded border-border text-primary focus:ring-primary"
				/>
				<Label for="cat-active" class="cursor-pointer text-xs font-medium">
					Aktifkan kategori ini untuk publik
				</Label>
			</div>

			<Dialog.Footer class="pt-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={() => (isCategoryModalOpen = false)}
				>
					Batal
				</Button>
				<Button type="submit" size="sm" disabled={isSubmitting}>
					{isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
