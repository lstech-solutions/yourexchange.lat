declare module '@supabase/ssr' {
  import { SupabaseClient, User } from '@supabase/supabase-js';
  import { CookieOptions } from '@supabase/ssr';
  
  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        get: (name: string) => string | undefined | null;
        set: (name: string, value: string, options: CookieOptions) => void;
        remove: (name: string, options: CookieOptions) => void;
      };
    }
  ): SupabaseClient;

  export interface CookieOptions {
    name: string;
    value: string;
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'lax' | 'strict' | 'none';
    secure?: boolean;
  }
}
