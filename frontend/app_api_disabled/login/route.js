import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  clearBackendAuthCookies,
  syncBackendAuthCookies,
} from "@/lib/backend-auth";

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
    clearBackendAuthCookies(response);

    if (backendResponse.ok && data.success) {
      syncBackendAuthCookies(response, backendResponse);
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
