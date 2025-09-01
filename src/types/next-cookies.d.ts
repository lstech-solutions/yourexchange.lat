import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

declare module 'next/headers' {
  export function cookies(): ReadonlyRequestCookies;
}

declare module 'next/dist/server/web/spec-extension/adapters/request-cookies' {
  export interface ReadonlyRequestCookies {
    get(name: string): { value: string } | undefined;
    set(
      name: string, 
      value: string, 
      options?: {
        name?: string;
        value?: string;
        httpOnly?: boolean;
        path?: string;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        maxAge?: number;
      }
    ): void;
  }
}
