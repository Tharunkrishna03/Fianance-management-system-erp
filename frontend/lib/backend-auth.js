import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";
export const AUTH_COOKIE_NAME = "jewel_finance_session";
export const CSRF_COOKIE_NAME = "jewel_finance_csrf";


function splitSetCookieHeader(headerValue) {
  const cookies = [];
  let current = "";
  let insideExpires = false;

  for (let index = 0; index < headerValue.length; index += 1) {
    const character = headerValue[index];
    const remaining = headerValue.slice(index).toLowerCase();

    if (!insideExpires && remaining.startsWith("expires=")) {
      insideExpires = true;
    }

    if (character === "," && !insideExpires) {
      cookies.push(current.trim());
      current = "";
      continue;
    }

    current += character;

    if (insideExpires && character === ";") {
      insideExpires = false;
    }
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies;
}


function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const setCookieHeader = response.headers.get("set-cookie");
  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
}


function normalizeSameSite(value) {
  const normalized = value.toLowerCase();

  if (normalized === "strict") {
    return "strict";
  }

  if (normalized === "none") {
    return "none";
  }

  return "lax";
}


function parseSetCookieHeader(setCookieValue) {
  const [nameValue, ...attributeParts] = setCookieValue.split(";").map((part) => part.trim());
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex < 1) {
    return null;
  }

  const cookie = {
    name: nameValue.slice(0, separatorIndex),
    value: nameValue.slice(separatorIndex + 1),
    options: {
      path: "/",
    },
  };

  for (const attribute of attributeParts) {
    const [rawKey, ...rawValueParts] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const value = rawValueParts.join("=");

    if (key === "httponly") {
      cookie.options.httpOnly = true;
      continue;
    }

    if (key === "secure") {
      cookie.options.secure = true;
      continue;
    }

    if (key === "path" && value) {
      cookie.options.path = value;
      continue;
    }

    if (key === "max-age" && value) {
      const maxAge = Number.parseInt(value, 10);

      if (Number.isFinite(maxAge)) {
        cookie.options.maxAge = maxAge;
      }

      continue;
    }

    if (key === "expires" && value) {
      cookie.options.expires = new Date(value);
      continue;
    }

    if (key === "samesite" && value) {
      cookie.options.sameSite = normalizeSameSite(value);
    }
  }

  return cookie;
}


function serializeBackendCookies(sessionId, csrfToken) {
  const cookiePairs = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
  ];

  if (csrfToken) {
    cookiePairs.push(`${CSRF_COOKIE_NAME}=${encodeURIComponent(csrfToken)}`);
  }

  return cookiePairs.join("; ");
}


export async function getBackendSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? "";
  const csrfToken = cookieStore.get(CSRF_COOKIE_NAME)?.value ?? "";

  if (!sessionId) {
    return null;
  }

  return {
    sessionId,
    csrfToken,
  };
}


export async function buildBackendHeaders(request, headers = {}, { includeCsrf = false } = {}) {
  const session = await getBackendSession();

  if (!session?.sessionId) {
    return null;
  }

  const backendHeaders = new Headers(headers);
  backendHeaders.set("Cookie", serializeBackendCookies(session.sessionId, session.csrfToken));

  if (includeCsrf) {
    if (!session.csrfToken) {
      return null;
    }

    const origin = request.nextUrl.origin;
    backendHeaders.set("X-CSRFToken", session.csrfToken);
    backendHeaders.set("Origin", origin);
    backendHeaders.set("Referer", `${origin}/`);
  }

  return backendHeaders;
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
      message: "Your session has expired. Please log in again.",
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


export function clearBackendAuthCookies(response) {
  for (const cookieName of [AUTH_COOKIE_NAME, CSRF_COOKIE_NAME]) {
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
}


export function syncBackendAuthCookies(response, backendResponse) {
  if (backendResponse.status === 401) {
    clearBackendAuthCookies(response);
    return response;
  }

  for (const setCookieHeader of getSetCookieHeaders(backendResponse)) {
    const parsedCookie = parseSetCookieHeader(setCookieHeader);

    if (!parsedCookie) {
      continue;
    }

    if (![AUTH_COOKIE_NAME, CSRF_COOKIE_NAME].includes(parsedCookie.name)) {
      continue;
    }

    response.cookies.set({
      name: parsedCookie.name,
      value: parsedCookie.value,
      httpOnly: parsedCookie.options.httpOnly ?? true,
      sameSite: parsedCookie.options.sameSite ?? "lax",
      secure: parsedCookie.options.secure ?? process.env.NODE_ENV === "production",
      path: parsedCookie.options.path ?? "/",
      ...(parsedCookie.options.maxAge !== undefined ? { maxAge: parsedCookie.options.maxAge } : {}),
      ...(parsedCookie.options.expires ? { expires: parsedCookie.options.expires } : {}),
    });
  }

  return response;
}
