import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildAuthHeaders,
  buildUnavailableResponse,
  getAuthenticatedUsername,
  parseBackendJson,
} from "../profile-api";

export async function POST(request) {
  const username = await getAuthenticatedUsername();

  if (!username) {
    return buildAuthErrorResponse();
  }

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

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/photo/`, {
      method: "POST",
      headers: buildAuthHeaders(username),
      body: backendFormData,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Photo service returned an invalid response.");
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile photo service.");
  }
}
