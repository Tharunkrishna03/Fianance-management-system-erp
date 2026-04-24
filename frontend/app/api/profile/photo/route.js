import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildBackendHeaders,
  buildUnavailableResponse,
  parseBackendJson,
  syncBackendAuthCookies,
} from "../profile-api";

export async function POST(request) {
  let incomingFormData;

  try {
    incomingFormData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Profile photo could not be read.",
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
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/photo/`, {
      method: "POST",
      headers: backendHeaders,
      body: backendFormData,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Photo service returned an invalid response.");
    const response = NextResponse.json(data, { status: backendResponse.status });
    return syncBackendAuthCookies(response, backendResponse);
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile photo service.");
  }
}
