import { loginSchema, registerSchema, hasRole } from './auth.ts';

function runAuthVerification() {
	console.log('Testing Phase 2 Auth & Role Validations...');

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

	const invalidLoginPass = loginSchema.safeParse({
		email: 'customer@titipin.id',
		password: '123'
	});
	if (invalidLoginPass.success) throw new Error('Short password should fail');

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

	const validProvider = registerSchema.safeParse({
		full_name: 'Warung Bu Siti',
		email: 'siti@titipin.id',
		phone: '08987654321',
		password: 'securePassword123',
		role: 'provider'
	});
	if (!validProvider.success) throw new Error('Valid provider register failed');

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
	console.log('All Phase 2 Auth verifications succeeded!');
}

runAuthVerification();
