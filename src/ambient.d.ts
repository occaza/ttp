/**
 * Ambient type declarations for SvelteKit virtual modules.
 * In Kit 3.x, $env modules are still provided by Vite at runtime
 * but no longer have built-in type declarations.
 */

declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
		[key: string]: string | undefined;
	};
}

declare module '$env/dynamic/private' {
	export const env: {
		SUPABASE_SERVICE_ROLE_KEY: string;
		[key: string]: string | undefined;
	};
}

declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
}

declare module '$env/static/private' {
	export const SUPABASE_SERVICE_ROLE_KEY: string;
}
