import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildBackendHeaders,
  buildUnavailableResponse,
  parseBackendJson,
  syncBackendAuthCookies,
} from "@/lib/backend-auth";

export async function GET(request) {
  const backendHeaders = await buildBackendHeaders(request);

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/settings/`, {
      method: "GET",
      headers: backendHeaders,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Settings service returned an invalid response.");
    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend settings service.");
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
        message: "Settings data could not be read.",
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
    const backendResponse = await fetch(`${BACKEND_URL}/api/settings/`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Settings service returned an invalid response.");
    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend settings service.");
  }
}
