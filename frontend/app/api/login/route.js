import { NextResponse } from "next/server";

const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";
const AUTH_COOKIE_NAME = "jewel_finance_session";
const USERNAME_COOKIE_NAME = "jewel_finance_username";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request payload.",
      },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await backendResponse.json().catch(() => ({
      success: false,
      message: "Authentication service returned an invalid response.",
    }));

    const response = NextResponse.json(data, { status: backendResponse.status });

    if (backendResponse.ok && data.success) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "authenticated",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      response.cookies.set({
        name: USERNAME_COOKIE_NAME,
        value: data.username ?? payload.username,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend login service.",
      },
      { status: 503 },
    );
  }
}
