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
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/`, {
      method: "GET",
      headers: backendHeaders,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Customer service returned an invalid response.");

    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend customer service.");
  }
}

export async function POST(request) {
  let incomingFormData;

  try {
    incomingFormData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Customer form data could not be read.",
      },
      { status: 400 },
    );
  }

  const backendFormData = new FormData();

  for (const [key, value] of incomingFormData.entries()) {
    backendFormData.append(key, value);
  }

  const backendHeaders = await buildBackendHeaders(request, {}, { includeCsrf: true });

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/`, {
      method: "POST",
      headers: backendHeaders,
      body: backendFormData,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Customer service returned an invalid response.");

    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend customer service.");
  }
}
