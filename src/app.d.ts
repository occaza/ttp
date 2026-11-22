import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile, UserRole } from '#lib/types/database.types.js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: Profile | null;
			role: UserRole | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			profile: Profile | null;
			role: UserRole | null;
		}
	}
}

export {};
