declare module 'next/headers' {
  export interface CookieOptions {
    name: string;
    value: string;
    expires?: Date | number;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  }

  export interface CookieStore {
    get(name: string): { value: string } | undefined;
    set(options: CookieOptions): void;
    delete(name: string, options?: Omit<CookieOptions, 'name' | 'value'>): void;
  }

  export function cookies(): CookieStore;
}
