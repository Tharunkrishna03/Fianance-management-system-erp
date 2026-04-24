import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildBackendHeaders,
  buildUnavailableResponse,
  parseBackendJson,
  syncBackendAuthCookies,
} from "./profile-api";

export async function GET(request) {
  const backendHeaders = await buildBackendHeaders(request);

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/`, {
      method: "GET",
      headers: backendHeaders,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Profile service returned an invalid response.");
    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile service.");
  }
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Profile request payload is invalid.",
      },
      { status: 400 },
    );
  }

  const backendHeaders = await buildBackendHeaders(
    request,
    { "Content-Type": "application/json" },
    { includeCsrf: true },
  );

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Profile service returned an invalid response.");
    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile service.");
  }
}
