const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  extra?: RequestOptions,
): Promise<T> {
  const timeoutMs = extra?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();

  const externalSignal = extra?.signal ?? options.signal;

  // eslint-disable-next-line prefer-const
  let timer: ReturnType<typeof setTimeout>;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          controller.abort(externalSignal.reason);
        },
        { once: true },
      );
    }
  }

  timer = setTimeout(() => controller.abort("Request timeout"), timeoutMs);

  try {
    const defaultHeaders: HeadersInit = options.body
      ? { "Content-Type": "application/json", ...options.headers }
      : { ...options.headers };

    const res = await fetch(path, {
      ...options,
      headers: defaultHeaders,
      signal: controller.signal,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Unauthorized");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail || res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function get<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, {}, options);
}

export function post<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
    options,
  );
}

export function put<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    },
    options,
  );
}

export function patch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    },
    options,
  );
}

export function del<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: "DELETE" }, options);
}
