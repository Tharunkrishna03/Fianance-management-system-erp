import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  clearBackendAuthCookies,
} from "@/lib/backend-auth";

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  const backendHeaders = await buildBackendHeaders(request, {}, { includeCsrf: true });

  if (backendHeaders) {
    try {
      await fetch(`${BACKEND_URL}/api/logout/`, {
        method: "POST",
        headers: backendHeaders,
        cache: "no-store",
      });
    } catch {
      // Clear the local session cookies even if the backend is currently unavailable.
    }
  }

  clearBackendAuthCookies(response);

  return response;
}
