import {
	loginSchema,
	registerSchema,
	hasRole,
	profileUpdateSchema,
	addressSchema,
	categorySchema
} from './auth.ts';

function runAuthVerification() {
	console.log('Testing Phase 2 & 3 Auth, Role, Address & Category Validations...');

	// 1. Test Login Schema
	const validLogin = loginSchema.safeParse({
		email: 'customer@titipin.id',
		password: 'password123'
	});
	if (!validLogin.success) throw new Error('Valid login failed validation');

	const invalidLoginEmail = loginSchema.safeParse({
		email: 'not-an-email',
		password: 'password123'
	});
	if (invalidLoginEmail.success) throw new Error('Invalid email should fail');

	console.log('✔ Login Schema Validation Passed');

	// 2. Test Register Schema
	const validCustomer = registerSchema.safeParse({
		full_name: 'Budi Santoso',
		email: 'budi@titipin.id',
		phone: '08123456789',
		password: 'securePassword123',
		role: 'customer'
	});
	if (!validCustomer.success) throw new Error('Valid customer register failed');

	const invalidRole = registerSchema.safeParse({
		full_name: 'Hacker',
		email: 'hacker@titipin.id',
		password: 'password123',
		role: 'superadmin' // should be rejected
	});
	if (invalidRole.success) throw new Error('Invalid role should fail');

	console.log('✔ Register Schema Validation Passed');

	// 3. Test Role Boundary Checks
	if (hasRole('customer', ['admin'])) throw new Error('Customer should not have admin role');
	if (hasRole('customer', ['provider'])) throw new Error('Customer should not have provider role');
	if (!hasRole('provider', ['provider', 'admin']))
		throw new Error('Provider should have provider role');
	if (!hasRole('admin', ['admin'])) throw new Error('Admin should have admin role');

	console.log('✔ Role Boundary Checks Passed');

	// 4. Test Phase 3 Profile Update Schema
	const validProfileUpdate = profileUpdateSchema.safeParse({
		full_name: 'Budi Santoso Updated',
		phone: '081298765432',
		avatar_url: ''
	});
	if (!validProfileUpdate.success) throw new Error('Valid profile update failed');

	const invalidProfileName = profileUpdateSchema.safeParse({
		full_name: 'A', // too short
		phone: '081298765432'
	});
	if (invalidProfileName.success) throw new Error('Short profile name should fail');

	console.log('✔ Profile Update Schema Validation Passed');

	// 5. Test Phase 3 Address Schema
	const validAddress = addressSchema.safeParse({
		label: 'Rumah',
		recipient_name: 'Budi Santoso',
		recipient_phone: '081234567890',
		street_address: 'Jl. Kemang Raya No. 12',
		notes: 'Pagar warna hitam samping minimarket',
		city: 'Jakarta Selatan',
		postal_code: '12730',
		is_primary: true
	});
	if (!validAddress.success) throw new Error('Valid address failed validation');

	const invalidAddressPhone = addressSchema.safeParse({
		label: 'Rumah',
		recipient_name: 'Budi',
		recipient_phone: '12345', // invalid phone
		street_address: 'Jl. Singkat',
		city: 'Jakarta Selatan'
	});
	if (invalidAddressPhone.success) throw new Error('Invalid address phone should fail');

	console.log('✔ Address Schema Validation Passed');

	// 6. Test Phase 3 Category Schema
	const validCategory = categorySchema.safeParse({
		name: 'Jastip Makanan & Minuman',
		slug: 'food-beverage',
		description: 'Kuliner resto dan kafe lokal',
		icon: 'utensils',
		is_active: true,
		sort_order: 1
	});
	if (!validCategory.success) throw new Error('Valid category failed validation');

	const invalidCategorySlug = categorySchema.safeParse({
		name: 'Kategori Salah',
		slug: 'Kategori Spasi & Simbol!', // invalid slug
		icon: 'store'
	});
	if (invalidCategorySlug.success) throw new Error('Invalid category slug should fail');

	console.log('✔ Category Schema Validation Passed');
	console.log('All Phase 2 & 3 verifications succeeded!');
}

runAuthVerification();
