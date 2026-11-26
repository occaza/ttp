export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'customer' | 'provider' | 'admin';
export type OrderStatus =
	| 'pending'
	| 'accepted'
	| 'rejected'
	| 'shopping'
	| 'purchased'
	| 'delivering'
	| 'completed'
	| 'cancelled';

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
					coverage_area: string | null;
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
					coverage_area?: string | null;
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
					coverage_area?: string | null;
					is_verified?: boolean;
					is_active?: boolean;
					rating_avg?: number;
					rating_count?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			provider_services: {
				Row: {
					id: string;
					provider_id: string;
					category_id: string;
					title: string;
					description: string | null;
					base_fee: number;
					coverage_area: string;
					is_active: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					provider_id: string;
					category_id: string;
					title: string;
					description?: string | null;
					base_fee?: number;
					coverage_area?: string;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					provider_id?: string;
					category_id?: string;
					title?: string;
					description?: string | null;
					base_fee?: number;
					coverage_area?: string;
					is_active?: boolean;
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
			service_categories: {
				Row: {
					id: string;
					name: string;
					slug: string;
					description: string | null;
					icon: string;
					is_active: boolean;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					slug: string;
					description?: string | null;
					icon?: string;
					is_active?: boolean;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					slug?: string;
					description?: string | null;
					icon?: string;
					is_active?: boolean;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			addresses: {
				Row: {
					id: string;
					user_id: string;
					label: string;
					recipient_name: string;
					recipient_phone: string;
					street_address: string;
					notes: string | null;
					city: string;
					postal_code: string | null;
					latitude: number | null;
					longitude: number | null;
					is_primary: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					label: string;
					recipient_name: string;
					recipient_phone: string;
					street_address: string;
					notes?: string | null;
					city?: string;
					postal_code?: string | null;
					latitude?: number | null;
					longitude?: number | null;
					is_primary?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					label?: string;
					recipient_name?: string;
					recipient_phone?: string;
					street_address?: string;
					notes?: string | null;
					city?: string;
					postal_code?: string | null;
					latitude?: number | null;
					longitude?: number | null;
					is_primary?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			platform_settings: {
				Row: {
					key: string;
					value: Json;
					description: string | null;
					updated_at: string;
				};
				Insert: {
					key: string;
					value: Json;
					description?: string | null;
					updated_at?: string;
				};
				Update: {
					key?: string;
					value?: Json;
					description?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			pricing_rules: {
				Row: {
					id: string;
					name: string;
					model: 'fixed' | 'distance_based' | 'shopping_delivery';
					base_fee: number;
					base_distance_km: number;
					per_km_fee: number;
					platform_fee: number;
					min_order_fee: number;
					is_active: boolean;
					metadata: Json;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					name: string;
					model: 'fixed' | 'distance_based' | 'shopping_delivery';
					base_fee?: number;
					base_distance_km?: number;
					per_km_fee?: number;
					platform_fee?: number;
					min_order_fee?: number;
					is_active?: boolean;
					metadata?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					model?: 'fixed' | 'distance_based' | 'shopping_delivery';
					base_fee?: number;
					base_distance_km?: number;
					per_km_fee?: number;
					platform_fee?: number;
					min_order_fee?: number;
					is_active?: boolean;
					metadata?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			orders: {
				Row: {
					id: string;
					order_number: string;
					customer_id: string;
					provider_id: string;
					service_id: string | null;
					category_id: string | null;
					status: OrderStatus;
					origin_name: string;
					origin_address: string | null;
					destination_address_id: string | null;
					destination_address_text: string;
					recipient_name: string;
					recipient_phone: string;
					pricing_snapshot: Json;
					estimated_item_cost: number;
					actual_item_cost: number | null;
					jastip_fee: number;
					total_estimated: number;
					actual_total: number | null;
					customer_notes: string | null;
					cancellation_reason: string | null;
					cancelled_by: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					order_number: string;
					customer_id: string;
					provider_id: string;
					service_id?: string | null;
					category_id?: string | null;
					status?: OrderStatus;
					origin_name: string;
					origin_address?: string | null;
					destination_address_id?: string | null;
					destination_address_text: string;
					recipient_name: string;
					recipient_phone: string;
					pricing_snapshot: Json;
					estimated_item_cost?: number;
					actual_item_cost?: number | null;
					jastip_fee?: number;
					total_estimated?: number;
					actual_total?: number | null;
					customer_notes?: string | null;
					cancellation_reason?: string | null;
					cancelled_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					order_number?: string;
					customer_id?: string;
					provider_id?: string;
					service_id?: string | null;
					category_id?: string | null;
					status?: OrderStatus;
					origin_name?: string;
					origin_address?: string | null;
					destination_address_id?: string | null;
					destination_address_text?: string;
					recipient_name?: string;
					recipient_phone?: string;
					pricing_snapshot?: Json;
					estimated_item_cost?: number;
					actual_item_cost?: number | null;
					jastip_fee?: number;
					total_estimated?: number;
					actual_total?: number | null;
					customer_notes?: string | null;
					cancellation_reason?: string | null;
					cancelled_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			order_items: {
				Row: {
					id: string;
					order_id: string;
					name: string;
					quantity: number;
					unit: string;
					notes: string | null;
					estimated_price: number | null;
					actual_price: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					order_id: string;
					name: string;
					quantity?: number;
					unit?: string;
					notes?: string | null;
					estimated_price?: number | null;
					actual_price?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					order_id?: string;
					name?: string;
					quantity?: number;
					unit?: string;
					notes?: string | null;
					estimated_price?: number | null;
					actual_price?: number | null;
					created_at?: string;
				};
				Relationships: [];
			};
			order_status_history: {
				Row: {
					id: string;
					order_id: string;
					from_status: string | null;
					to_status: string;
					actor_id: string;
					actor_role: 'customer' | 'provider' | 'admin' | 'system';
					note: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					order_id: string;
					from_status?: string | null;
					to_status: string;
					actor_id: string;
					actor_role: 'customer' | 'provider' | 'admin' | 'system';
					note?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					order_id?: string;
					from_status?: string | null;
					to_status?: string;
					actor_id?: string;
					actor_role?: 'customer' | 'provider' | 'admin' | 'system';
					note?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			order_messages: {
				Row: {
					id: string;
					order_id: string;
					sender_id: string | null;
					sender_role: 'customer' | 'provider' | 'admin' | 'system';
					message: string;
					is_system: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					order_id: string;
					sender_id?: string | null;
					sender_role: 'customer' | 'provider' | 'admin' | 'system';
					message: string;
					is_system?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					order_id?: string;
					sender_id?: string | null;
					sender_role?: 'customer' | 'provider' | 'admin' | 'system';
					message?: string;
					is_system?: boolean;
					created_at?: string;
				};
				Relationships: [];
			};
			order_attachments: {
				Row: {
					id: string;
					order_id: string;
					uploader_id: string;
					attachment_type: 'receipt' | 'delivery_proof' | 'chat_image';
					file_path: string;
					file_name: string;
					mime_type: string;
					file_size: number;
					note: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					order_id: string;
					uploader_id: string;
					attachment_type: 'receipt' | 'delivery_proof' | 'chat_image';
					file_path: string;
					file_name: string;
					mime_type: string;
					file_size: number;
					note?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					order_id?: string;
					uploader_id?: string;
					attachment_type?: 'receipt' | 'delivery_proof' | 'chat_image';
					file_path?: string;
					file_name?: string;
					mime_type?: string;
					file_size?: number;
					note?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			notifications: {
				Row: {
					id: string;
					user_id: string;
					order_id: string | null;
					title: string;
					body: string;
					type: 'order_update' | 'chat_message' | 'evidence_uploaded' | 'system';
					is_read: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					order_id?: string | null;
					title: string;
					body: string;
					type?: 'order_update' | 'chat_message' | 'evidence_uploaded' | 'system';
					is_read?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					order_id?: string | null;
					title?: string;
					body?: string;
					type?: 'order_update' | 'chat_message' | 'evidence_uploaded' | 'system';
					is_read?: boolean;
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
export type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type ProviderService = Database['public']['Tables']['provider_services']['Row'];
export type PricingRule = Database['public']['Tables']['pricing_rules']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderStatusHistory = Database['public']['Tables']['order_status_history']['Row'];
export type OrderMessage = Database['public']['Tables']['order_messages']['Row'];
export type OrderAttachment = Database['public']['Tables']['order_attachments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
