import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";
const AUTH_COOKIE_NAME = "jewel_finance_session";
const USERNAME_COOKIE_NAME = "jewel_finance_username";

export async function getAuthenticatedUsername() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const usernameCookie = cookieStore.get(USERNAME_COOKIE_NAME);

  if (!authCookie || authCookie.value !== "authenticated" || !usernameCookie?.value) {
    return null;
  }

  return usernameCookie.value;
}

export function buildAuthHeaders(username, headers = {}) {
  return {
    ...headers,
    "X-Authenticated-Username": username,
  };
}

export async function parseBackendJson(response, fallbackMessage) {
  return response.json().catch(() => ({
    success: false,
    message: fallbackMessage,
  }));
}

export function buildAuthErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Your session is missing profile access details. Please log out and log in again.",
    },
    { status: 401 },
  );
}

export function buildUnavailableResponse(message) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 503 },
  );
}
