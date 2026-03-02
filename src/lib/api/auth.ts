import { get } from "./client";
import type { UserResponse } from "./types";
import type { RequestOptions } from "./client";

export function fetchMe(options?: RequestOptions): Promise<UserResponse> {
  return get<UserResponse>("/api/user/me", options);
}
