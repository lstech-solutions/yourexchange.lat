/**
 * Utility functions for Supabase Edge Functions
 * This provides a type-safe way to call Supabase functions without direct dependency on @supabase/functions-js
 */

type FunctionResponse<T = any> = {
  data: T | null;
  error: Error | null;
};

export async function invokeFunction<T = any>(
  functionName: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
    jwt?: string;
  }
): Promise<FunctionResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.jwt && { Authorization: `Bearer ${options.jwt}` }),
      ...(options?.headers || {}),
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: new Error(
          errorData.error?.message ||
            `Function ${functionName} failed with status ${response.status}`
        ),
      };
    }

    const data = await response.json().catch(() => ({}));
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error(`Failed to invoke function ${functionName}`),
    };
  }
}
