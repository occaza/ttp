export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'customer' | 'provider' | 'admin';

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					full_name: string;
					phone: string | null;
					avatar_url: string | null;
					role: UserRole;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					full_name: string;
					phone?: string | null;
					avatar_url?: string | null;
					role?: UserRole;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					full_name?: string;
					phone?: string | null;
					avatar_url?: string | null;
					role?: UserRole;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			provider_profiles: {
				Row: {
					id: string;
					user_id: string;
					business_name: string | null;
					bio: string | null;
					is_verified: boolean;
					is_active: boolean;
					rating_avg: number;
					rating_count: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					user_id: string;
					business_name?: string | null;
					bio?: string | null;
					is_verified?: boolean;
					is_active?: boolean;
					rating_avg?: number;
					rating_count?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					business_name?: string | null;
					bio?: string | null;
					is_verified?: boolean;
					is_active?: boolean;
					rating_avg?: number;
					rating_count?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			user_roles: {
				Row: {
					id: string;
					user_id: string;
					role: UserRole;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					role: UserRole;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					role?: UserRole;
					created_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			user_role: UserRole;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];
export type UserRoleRecord = Database['public']['Tables']['user_roles']['Row'];
