import { useState, useCallback, useRef, useEffect } from "react";

export interface UseFetchOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  transform?: (data: unknown) => T;
}

export interface UseFetchResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useFetch<T>(
  fetchFn: (...args: unknown[]) => Promise<T>,
  options?: UseFetchOptions<T>
): UseFetchResult<T> {
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const { immediate = false, onSuccess, onError, onFinally, transform } = options || {};

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (mountedRef.current) {
        setIsLoading(true);
        setError(undefined);
      }

      try {
        let result = await fetchFn(...args);

        if (transform) {
          result = transform(result);
        }

        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          isSuccessRef.current = true;
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        if (mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsLoading(false);
          onError?.(error);
        }
        return undefined;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          onFinally?.();
        }
      }
    },
    [fetchFn, transform, onSuccess, onError, onFinally]
  );

  const reset = useCallback(() => {
    setData(options?.initialData);
    setError(undefined);
    setIsLoading(false);
  }, [options?.initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const isSuccessRef = useRef(false);

  return {
    data,
    error,
    isLoading,
    isSuccess: isSuccessRef.current && !isLoading && !error,
    isError: !!error,
    execute,
    reset,
  };
}

export interface UseQueryOptions<T> extends UseFetchOptions<T> {
  queryKey?: string[];
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
): UseFetchResult<T> & { refetch: () => Promise<T | undefined> } {
  const result = useFetch(queryFn, options);

  return {
    ...result,
    refetch: result.execute,
  };
}

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | undefined, error: Error | undefined, variables: V) => void;
}

export interface UseMutationResult<T, V> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (variables: V) => void;
  mutateAsync: (variables: V) => Promise<T | undefined>;
  reset: () => void;
}

export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: UseMutationOptions<T, V>
): UseMutationResult<T, V> {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const { onSuccess, onError, onSettled } = options || {};

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutateAsync = useCallback(
    async (variables: V): Promise<T | undefined> => {
      if (mountedRef.current) {
        setIsLoading(true);
        setError(undefined);
      }

      try {
        const result = await mutationFn(variables);

        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          onSuccess?.(result, variables);
          onSettled?.(result, undefined, variables);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setError(error);
          setIsLoading(false);
          onError?.(error, variables);
          onSettled?.(undefined, error, variables);
        }

        return undefined;
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    (variables: V) => {
      mutateAsync(variables);
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    isSuccess: !isLoading && !!data && !error,
    isError: !!error,
    mutate,
    mutateAsync,
    reset,
  };
}

export default useFetch;
