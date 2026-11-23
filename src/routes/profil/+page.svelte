<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.js';
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
		AlertCircle
	} from 'lucide-svelte';
	import type { Address } from '#lib/types/database.types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isEditingProfile = $state(false);
	let isAddressModalOpen = $state(false);
	let editingAddress = $state<Address | null>(null);

	// Address modal fields
	let addressId = $state('');
	let addressLabel = $state('');
	let recipientName = $state('');
	let recipientPhone = $state('');
	let streetAddress = $state('');
	let notes = $state('');
	let city = $state('Jakarta Selatan');
	let postalCode = $state('');
	let isPrimary = $state(false);

	function openAddAddressModal() {
		editingAddress = null;
		addressId = '';
		addressLabel = '';
		recipientName = data.profile?.full_name || '';
		recipientPhone = data.profile?.phone || '';
		streetAddress = '';
		notes = '';
		city = 'Jakarta Selatan';
		postalCode = '';
		isPrimary = data.addresses.length === 0;
		isAddressModalOpen = true;
	}

	function openEditAddressModal(addr: Address) {
		editingAddress = addr;
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
	}
</script>

<svelte:head>
	<title>Profil Saya & Alamat - Titipin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8">
	<!-- Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				Profil & Pengaturan
			</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Kelola informasi akun dan daftar alamat pengantaran Anda
			</p>
		</div>

		<div class="flex items-center gap-2">
			{#if data.role === 'provider' || data.role === 'admin'}
				<Button
					variant="outline"
					size="sm"
					href={resolve('/mitra/dashboard')}
					class="gap-1.5 text-xs"
				>
					<LayoutDashboard class="size-3.5" />
					<span>Dashboard Mitra</span>
				</Button>
			{/if}

			{#if data.role === 'admin'}
				<Button
					variant="outline"
					size="sm"
					href={resolve('/admin')}
					class="gap-1.5 text-xs text-destructive hover:text-destructive"
				>
					<ShieldCheck class="size-3.5" />
					<span>Admin</span>
				</Button>
			{/if}

			<form method="POST" action={resolve('/keluar')}>
				<Button
					variant="ghost"
					size="sm"
					type="submit"
					class="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
				>
					<LogOut class="size-3.5" />
					<span>Keluar</span>
				</Button>
			</form>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if form?.profileSuccess || form?.addressSuccess}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{form.profileSuccess || form.addressSuccess}</span>
		</div>
	{/if}

	{#if form?.profileError || form?.addressError}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>{form.profileError || form.addressError}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<!-- Left: Profile Overview & Edit -->
		<div class="space-y-6 lg:col-span-5">
			<Card class="border-border/80 shadow-xs">
				<CardHeader class="pb-3">
					<div class="flex items-center justify-between">
						<CardTitle class="text-base font-bold">Informasi Pribadi</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 text-xs font-semibold text-primary"
							onclick={() => (isEditingProfile = !isEditingProfile)}
						>
							{isEditingProfile ? 'Batal' : 'Ubah Data'}
						</Button>
					</div>
					<CardDescription class="text-xs">
						Data identitas yang terverifikasi di Titipin
					</CardDescription>
				</CardHeader>

				<CardContent class="space-y-4 text-xs sm:text-sm">
					<div class="flex items-center gap-3 border-b border-border/60 pb-3">
						<div
							class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary"
						>
							{data.profile?.full_name?.charAt(0).toUpperCase() || 'U'}
						</div>
						<div class="min-w-0 flex-1">
							<span class="block truncate font-bold text-foreground">
								{data.profile?.full_name || 'Pengguna'}
							</span>
							<Badge variant="secondary" class="mt-1 text-[10px] font-bold">
								{data.role?.toUpperCase() || 'CUSTOMER'}
							</Badge>
						</div>
					</div>

					{#if isEditingProfile}
						<form method="POST" action="?/updateProfile" class="space-y-3.5 pt-1">
							<div class="space-y-1">
								<Label for="full_name" class="text-xs font-semibold">Nama Lengkap</Label>
								<Input
									id="full_name"
									name="full_name"
									value={data.profile?.full_name || ''}
									required
									minlength={2}
									class="h-9 text-xs"
								/>
							</div>

							<div class="space-y-1">
								<Label for="phone" class="text-xs font-semibold">Nomor Telepon / WhatsApp</Label>
								<Input
									id="phone"
									name="phone"
									value={data.profile?.phone || ''}
									placeholder="Contoh: 08123456789"
									class="h-9 text-xs"
								/>
							</div>

							<Button size="sm" type="submit" class="w-full text-xs font-bold">
								Simpan Perubahan
							</Button>
						</form>
					{:else}
						<div class="space-y-2.5">
							<div class="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
								<Mail class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">Email Terdaftar</span>
									<span class="block truncate font-medium text-foreground">{data.user?.email}</span>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
								<Phone class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">Nomor Telepon</span>
									<span class="font-medium text-foreground">
										{data.profile?.phone || 'Belum ditambahkan'}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
								<User class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">User ID</span>
									<span class="block truncate font-mono text-[11px] text-muted-foreground">
										{data.user?.id}
									</span>
								</div>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Right: Saved Addresses Section -->
		<div class="space-y-6 lg:col-span-7">
			<Card class="border-border/80 shadow-xs">
				<CardHeader class="pb-3">
					<div class="flex items-center justify-between">
						<div>
							<CardTitle class="text-base font-bold">Alamat Tersimpan</CardTitle>
							<CardDescription class="text-xs">
								Daftar alamat untuk tujuan pengantaran belanjaan Anda
							</CardDescription>
						</div>

						<Button size="sm" class="gap-1.5 text-xs font-bold" onclick={openAddAddressModal}>
							<Plus class="size-3.5" />
							<span>Tambah Alamat</span>
						</Button>
					</div>
				</CardHeader>

				<CardContent class="space-y-3 pt-2">
					{#if data.addresses.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-10 text-center"
						>
							<MapPin class="size-8 text-muted-foreground/60" />
							<p class="mt-2 text-xs font-semibold text-foreground">Belum ada alamat tersimpan</p>
							<p class="max-w-xs text-[11px] text-muted-foreground">
								Tambahkan alamat rumah, kantor, atau kost agar pesanan jastip langsung terarah
								dengan akurat.
							</p>
							<Button
								variant="outline"
								size="sm"
								class="mt-4 gap-1.5 text-xs font-semibold"
								onclick={openAddAddressModal}
							>
								<Plus class="size-3.5" />
								<span>Tambah Alamat Sekarang</span>
							</Button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each data.addresses as addr (addr.id)}
								<div
									class="relative flex flex-col justify-between rounded-xl border {addr.is_primary
										? 'border-primary/60 bg-primary/5'
										: 'border-border/80 bg-card'} p-4 shadow-2xs transition-all sm:flex-row sm:items-start"
								>
									<div class="space-y-1.5">
										<div class="flex items-center gap-2">
											<span class="text-xs font-black text-foreground">{addr.label}</span>
											{#if addr.is_primary}
												<Badge variant="default" class="h-4.5 px-1.5 text-[9px] font-bold">
													Alamat Utama
												</Badge>
											{/if}
										</div>

										<p class="text-xs font-medium text-foreground">
											<span class="font-bold">{addr.recipient_name}</span> ({addr.recipient_phone})
										</p>

										<p class="text-xs leading-relaxed text-muted-foreground">
											{addr.street_address}, {addr.city}
											{addr.postal_code ? `(${addr.postal_code})` : ''}
										</p>

										{#if addr.notes}
											<p class="text-[11px] text-muted-foreground/80 italic">
												Patokan: {addr.notes}
											</p>
										{/if}
									</div>

									<div
										class="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-2.5 sm:mt-0 sm:border-0 sm:pt-0"
									>
										{#if !addr.is_primary}
											<form method="POST" action="?/setPrimaryAddress">
												<input type="hidden" name="id" value={addr.id} />
												<Button
													variant="ghost"
													size="sm"
													type="submit"
													class="h-7 px-2 text-[11px] font-semibold text-primary hover:text-primary"
													title="Jadikan Alamat Utama"
												>
													<Star class="mr-1 size-3" />
													<span>Utamakan</span>
												</Button>
											</form>
										{/if}

										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
											onclick={() => openEditAddressModal(addr)}
											title="Edit Alamat"
										>
											<Edit3 class="mr-1 size-3" />
											<span>Edit</span>
										</Button>

										<form
											method="POST"
											action="?/deleteAddress"
											onsubmit={(e) => {
												if (!confirm(`Hapus alamat "${addr.label}"?`)) e.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={addr.id} />
											<Button
												variant="ghost"
												size="sm"
												type="submit"
												class="h-7 px-2 text-[11px] font-semibold text-destructive hover:text-destructive"
												title="Hapus Alamat"
											>
												<Trash2 class="size-3" />
											</Button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
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
						{editingAddress ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
					</h3>
					<p class="text-[11px] text-muted-foreground">
						Pastikan nomor telepon dan alamat jalan lengkap untuk kurir
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

			<form
				method="POST"
				action="?/saveAddress"
				class="mt-4 space-y-3.5"
				onsubmit={() => {
					isAddressModalOpen = false;
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
							placeholder="Contoh: Rumah, Kost"
							required
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1">
						<Label for="city" class="text-xs font-semibold">Kota / Wilayah</Label>
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
						<Label for="recipient_phone" class="text-xs font-semibold">No. Telepon Penerima</Label>
						<Input
							id="recipient_phone"
							name="recipient_phone"
							bind:value={recipientPhone}
							placeholder="Contoh: 08123456789"
							required
							class="h-9 text-xs"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<Label for="street_address" class="text-xs font-semibold">
						Alamat Lengkap (Jalan, RT/RW, No. Rumah)
					</Label>
					<Textarea
						id="street_address"
						name="street_address"
						bind:value={streetAddress}
						placeholder="Jl. Melati No. 45, RT 02/RW 04, Kelurahan..."
						required
						rows={2}
						class="text-xs"
					/>
				</div>

				<div class="grid grid-cols-3 gap-3">
					<div class="col-span-2 space-y-1">
						<Label for="notes" class="text-xs font-semibold">Catatan Patokan (Opsional)</Label>
						<Input
							id="notes"
							name="notes"
							bind:value={notes}
							placeholder="Contoh: Pagar hijau depan pos satpam"
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1">
						<Label for="postal_code" class="text-xs font-semibold">Kode Pos</Label>
						<Input
							id="postal_code"
							name="postal_code"
							bind:value={postalCode}
							placeholder="12730"
							class="h-9 text-xs"
						/>
					</div>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						type="checkbox"
						id="is_primary"
						name="is_primary"
						bind:checked={isPrimary}
						class="size-4 rounded border-border text-primary focus:ring-primary"
					/>
					<Label for="is_primary" class="cursor-pointer text-xs font-medium text-foreground">
						Jadikan sebagai alamat utama
					</Label>
				</div>

				<div class="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
					<Button variant="outline" size="sm" type="button" onclick={closeModal} class="text-xs">
						Batal
					</Button>
					<Button size="sm" type="submit" class="text-xs font-bold">
						{editingAddress ? 'Simpan Perubahan' : 'Tambah Alamat'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
