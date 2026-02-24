import { get } from "./client";
import type { UserResponse } from "./types";

export function fetchMe(): Promise<UserResponse> {
  return get<UserResponse>("/api/auth/me");
}
