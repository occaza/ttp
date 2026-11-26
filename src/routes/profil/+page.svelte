<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import {
		User,
		Mail,
		Phone,
		ShieldCheck,
		LogOut,
		LayoutDashboard,
		MapPin,
		Plus,
		CheckCircle2,
		Trash2,
		Edit3,
		Star,
		X,
		AlertCircle,
		ArrowRight
	} from 'lucide-svelte';
	import type { Address } from '#lib/types/database.types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isEditingProfile = $state(false);
	let isAddressModalOpen = $state(false);
	let editingAddress = $state<Address | null>(null);
	let savingAddress = $state(false);
	let modalError = $state('');

	// Address modal fields
	let addressId = $state('');
	let addressLabel = $state('');
	let recipientName = $state('');
	let recipientPhone = $state('');
	let streetAddress = $state('');
	let notes = $state('');
	let city = $state('Gatak, Sukoharjo');
	let postalCode = $state('');
	let isPrimary = $state(false);

	function openAddAddressModal() {
		editingAddress = null;
		modalError = '';
		addressId = '';
		addressLabel = '';
		recipientName = data.profile?.full_name || '';
		recipientPhone = data.profile?.phone || '';
		streetAddress = '';
		notes = '';
		city = 'Gatak, Sukoharjo';
		postalCode = '';
		isPrimary = data.addresses.length === 0;
		isAddressModalOpen = true;
	}

	function openEditAddressModal(addr: Address) {
		editingAddress = addr;
		modalError = '';
		addressId = addr.id;
		addressLabel = addr.label;
		recipientName = addr.recipient_name;
		recipientPhone = addr.recipient_phone;
		streetAddress = addr.street_address;
		notes = addr.notes || '';
		city = addr.city;
		postalCode = addr.postal_code || '';
		isPrimary = addr.is_primary;
		isAddressModalOpen = true;
	}

	function closeModal() {
		isAddressModalOpen = false;
		editingAddress = null;
		modalError = '';
	}
</script>

<svelte:head>
	<title>Profil & Alamat - Titipin</title>
	<meta
		name="description"
		content="Kelola data pribadi dan daftar alamat pengantaran titip belanja lokal Anda."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
	<!-- Page Header -->
	<div
		class="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Pengaturan Profil & Alamat
			</h1>
			<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
				Kelola informasi identitas akun Anda dan buku alamat tujuan pengantaran belanja.
			</p>
		</div>

		<form method="POST" action={resolve('/keluar')}>
			<Button
				variant="outline"
				size="sm"
				type="submit"
				class="h-9 gap-2 rounded-xl text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
			>
				<LogOut class="size-3.5" />
				<span>Keluar dari Akun</span>
			</Button>
		</form>
	</div>

	<!-- Alert Notifications -->
	{#if form?.profileSuccess || form?.addressSuccess}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
			role="status"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.profileSuccess || form.addressSuccess}</span>
		</div>
	{/if}

	{#if form?.profileError || form?.addressError}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive"
			role="alert"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.profileError || form.addressError}</span>
		</div>
	{/if}

	<!-- 2-Column Responsive Layout -->
	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
		<!-- Left Column: Identity & Account Card -->
		<div class="space-y-6 lg:col-span-5">
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div class="flex items-center justify-between border-b border-border/60 pb-4">
					<h2 class="text-sm font-bold text-foreground">Identitas Pengguna</h2>
					<button
						type="button"
						class="text-xs font-semibold text-primary transition-colors hover:underline"
						onclick={() => (isEditingProfile = !isEditingProfile)}
					>
						{isEditingProfile ? 'Batal' : 'Ubah Data'}
					</button>
				</div>

				<div class="mt-5 space-y-5">
					<!-- User Header Info -->
					<div class="flex items-center gap-4">
						<div
							class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary"
						>
							{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
						</div>
						<div class="min-w-0 flex-1">
							<span class="block truncate text-base font-bold text-foreground">
								{data.profile?.full_name || 'Pengguna'}
							</span>
							<div class="mt-1 flex items-center gap-2">
								<span
									class="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase"
								>
									{data.role || 'customer'}
								</span>
								<span class="text-[11px] text-muted-foreground">Akun Terverifikasi</span>
							</div>
						</div>
					</div>

					<!-- Role Shortcut Action (Admin / Mitra) -->
					{#if data.role === 'admin'}
						<div class="rounded-xl border border-border/70 bg-muted/40 p-3.5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<ShieldCheck class="size-4 text-primary" />
									<span class="text-xs font-bold text-foreground">Admin Console</span>
								</div>
								<a
									href={resolve('/admin')}
									class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
								>
									<span>Buka Panel</span>
									<ArrowRight class="size-3" />
								</a>
							</div>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Kelola kategori, pengguna, dan pengaturan operasional platform.
							</p>
						</div>
					{:else if data.role === 'provider'}
						<div class="rounded-xl border border-border/70 bg-muted/40 p-3.5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<LayoutDashboard class="size-4 text-primary" />
									<span class="text-xs font-bold text-foreground">Dashboard Mitra</span>
								</div>
								<a
									href={resolve('/mitra/dashboard')}
									class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
								>
									<span>Buka Dashboard</span>
									<ArrowRight class="size-3" />
								</a>
							</div>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Lihat penawaran jasa, transaksi aktif, dan penerimaan titipan belanja.
							</p>
						</div>
					{/if}

					<!-- Edit Form or Readonly View -->
					{#if isEditingProfile}
						<form method="POST" action="?/updateProfile" class="space-y-4 pt-2">
							<div class="space-y-1.5">
								<Label for="full_name" class="text-xs font-semibold text-foreground">
									Nama Lengkap
								</Label>
								<Input
									id="full_name"
									name="full_name"
									value={data.profile?.full_name || ''}
									placeholder="Nama lengkap Anda"
									required
									class="h-9 text-xs"
								/>
							</div>

							<div class="space-y-1.5">
								<Label for="phone" class="text-xs font-semibold text-foreground">
									Nomor WhatsApp
								</Label>
								<Input
									id="phone"
									name="phone"
									value={data.profile?.phone || ''}
									placeholder="08123456789"
									class="h-9 text-xs"
								/>
							</div>

							<div class="flex items-center justify-end gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									type="button"
									class="h-8 text-xs"
									onclick={() => (isEditingProfile = false)}
								>
									Batal
								</Button>
								<Button size="sm" type="submit" class="h-8 text-xs font-semibold">
									Simpan Perubahan
								</Button>
							</div>
						</form>
					{:else}
						<div class="space-y-3 pt-1 text-xs">
							<div
								class="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
							>
								<Mail class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">Email Terdaftar</span>
									<span class="block truncate font-medium text-foreground">
										{data.user?.email}
									</span>
								</div>
							</div>

							<div
								class="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
							>
								<Phone class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">Nomor WhatsApp</span>
									<span class="block truncate font-medium text-foreground">
										{data.profile?.phone || 'Belum ditambahkan'}
									</span>
								</div>
							</div>

							<div
								class="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
							>
								<User class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">ID Pengguna</span>
									<span class="block truncate font-mono text-[11px] text-muted-foreground">
										{data.user?.id}
									</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column: Saved Addresses Section -->
		<div class="space-y-6 lg:col-span-7">
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
				<div
					class="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-sm font-bold text-foreground">Buku Alamat Pengantaran</h2>
							<span
								class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
							>
								{data.addresses.length} Alamat
							</span>
						</div>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Tujuan pengantaran belanjaan titipan Anda oleh mitra lokal.
						</p>
					</div>

					{#if data.addresses.length > 0}
						<Button
							size="sm"
							class="h-8 gap-1.5 rounded-xl text-xs font-semibold"
							onclick={openAddAddressModal}
						>
							<Plus class="size-3.5" />
							<span>Tambah Alamat</span>
						</Button>
					{/if}
				</div>

				<div class="mt-5">
					{#if data.addresses.length === 0}
						<!-- Clean Empty State -->
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-12 text-center"
						>
							<div
								class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<MapPin class="size-6" />
							</div>
							<h3 class="mt-3 text-sm font-bold text-foreground">Belum ada alamat tersimpan</h3>
							<p class="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
								Tambahkan alamat rumah, kost, atau toko di area Gatak dan sekitarnya agar pesanan
								titip belanja dapat langsung diantar dengan akurat.
							</p>
							<Button
								size="sm"
								class="mt-5 h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-xs"
								onclick={openAddAddressModal}
							>
								<Plus class="size-3.5" />
								<span>Tambah Alamat Pertama</span>
							</Button>
						</div>
					{:else}
						<!-- Address Cards List -->
						<div class="space-y-4">
							{#each data.addresses as addr (addr.id)}
								<div
									class="relative flex flex-col justify-between rounded-xl border {addr.is_primary
										? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
										: 'border-border/80 bg-card'} p-4.5 shadow-2xs transition-all hover:border-primary/40 sm:flex-row sm:items-start"
								>
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<span class="text-xs font-bold text-foreground">{addr.label}</span>
											{#if addr.is_primary}
												<span
													class="inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground"
												>
													<Star class="size-2.5 fill-current" />
													<span>Utama</span>
												</span>
											{/if}
										</div>

										<p class="text-xs font-medium text-foreground">
											<span class="font-bold">{addr.recipient_name}</span> &bull; {addr.recipient_phone}
										</p>

										<p class="text-xs leading-relaxed text-muted-foreground">
											{addr.street_address}, {addr.city}
											{addr.postal_code ? `(${addr.postal_code})` : ''}
										</p>

										{#if addr.notes}
											<div
												class="rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground"
											>
												<span class="font-semibold text-foreground">Patokan:</span>
												{addr.notes}
											</div>
										{/if}
									</div>

									<div class="mt-3 flex items-center gap-1.5 sm:mt-0 sm:shrink-0">
										{#if !addr.is_primary}
											<form method="POST" action="?/setPrimaryAddress">
												<input type="hidden" name="id" value={addr.id} />
												<button
													type="submit"
													class="inline-flex h-7 items-center rounded-lg border border-border/70 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
												>
													<span>Jadikan Utama</span>
												</button>
											</form>
										{/if}

										<button
											type="button"
											class="inline-flex h-7 items-center rounded-lg border border-border/70 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
											onclick={() => openEditAddressModal(addr)}
											title="Edit Alamat"
										>
											<Edit3 class="mr-1 size-3" />
											<span>Edit</span>
										</button>

										<form
											method="POST"
											action="?/deleteAddress"
											onsubmit={(e) => {
												if (!confirm(`Hapus alamat "${addr.label}"?`)) e.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={addr.id} />
											<button
												type="submit"
												class="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
												title="Hapus Alamat"
											>
												<Trash2 class="size-3" />
												<span class="sr-only">Hapus</span>
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Add / Edit Address Dialog Modal -->
{#if isAddressModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
			<div class="flex items-center justify-between border-b border-border/60 pb-3">
				<div>
					<h3 class="text-base font-bold text-foreground">
						{editingAddress ? 'Ubah Alamat Pengantaran' : 'Tambah Alamat Baru'}
					</h3>
					<p class="text-[11px] text-muted-foreground">
						Pastikan nomor kontak dan rincian jalan jelas agar kurir dapat mengantar tepat waktu.
					</p>
				</div>
				<button
					type="button"
					class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					onclick={closeModal}
					aria-label="Tutup"
				>
					<X class="size-4" />
				</button>
			</div>

			{#if modalError}
				<div
					class="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0" />
					<span>{modalError}</span>
				</div>
			{/if}

			<form
				method="POST"
				action="?/saveAddress"
				class="mt-4 space-y-3.5"
				use:enhance={() => {
					savingAddress = true;
					modalError = '';
					return async ({ result, update }) => {
						savingAddress = false;
						if (result.type === 'failure') {
							const resData = result.data as { addressError?: string } | undefined;
							modalError = resData?.addressError || 'Gagal menyimpan alamat. Periksa data kembali.';
						} else if (result.type === 'success') {
							isAddressModalOpen = false;
							await update();
						} else {
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="id" value={addressId} />

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<Label for="label" class="text-xs font-semibold">Label Alamat</Label>
						<Input
							id="label"
							name="label"
							bind:value={addressLabel}
							placeholder="Contoh: Rumah, Kost, Kantor"
							required
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1">
						<Label for="city" class="text-xs font-semibold">Kota / Kecamatan</Label>
						<Input id="city" name="city" bind:value={city} required class="h-9 text-xs" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<Label for="recipient_name" class="text-xs font-semibold">Nama Penerima</Label>
						<Input
							id="recipient_name"
							name="recipient_name"
							bind:value={recipientName}
							required
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1">
						<Label for="recipient_phone" class="text-xs font-semibold">No. WhatsApp Penerima</Label>
						<Input
							id="recipient_phone"
							name="recipient_phone"
							bind:value={recipientPhone}
							placeholder="08123456789"
							required
							class="h-9 text-xs"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<Label for="street_address" class="text-xs font-semibold">
						Alamat Lengkap (Jalan, Dusun/RT/RW, No. Rumah)
					</Label>
					<Textarea
						id="street_address"
						name="street_address"
						bind:value={streetAddress}
						placeholder="Jl. Raya Gawok No. 12, RT 01/RW 03, Trangsan..."
						required
						rows={2}
						class="text-xs"
					/>
				</div>

				<div class="grid grid-cols-3 gap-3">
					<div class="col-span-2 space-y-1">
						<Label for="notes" class="text-xs font-semibold">Catatan Patokan Lokasi</Label>
						<Input
							id="notes"
							name="notes"
							bind:value={notes}
							placeholder="Contoh: Depan gardu ronda, pagar hitam"
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1">
						<Label for="postal_code" class="text-xs font-semibold">Kode Pos</Label>
						<Input
							id="postal_code"
							name="postal_code"
							bind:value={postalCode}
							placeholder="57557"
							class="h-9 text-xs"
						/>
					</div>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						type="checkbox"
						id="is_primary"
						name="is_primary"
						value="true"
						bind:checked={isPrimary}
						class="size-4 rounded border-border text-primary focus:ring-primary"
					/>
					<Label for="is_primary" class="cursor-pointer text-xs font-medium text-foreground">
						Jadikan sebagai alamat utama
					</Label>
				</div>

				<div class="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
					<Button
						variant="outline"
						size="sm"
						type="button"
						onclick={closeModal}
						class="text-xs"
						disabled={savingAddress}
					>
						Batal
					</Button>
					<Button size="sm" type="submit" class="text-xs font-bold" disabled={savingAddress}>
						{#if savingAddress}
							<span
								class="mr-1.5 size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></span>
							<span>Menyimpan...</span>
						{:else}
							<span>{editingAddress ? 'Simpan Perubahan' : 'Tambah Alamat'}</span>
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
