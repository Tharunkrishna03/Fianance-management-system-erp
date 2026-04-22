import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildAuthHeaders,
  buildUnavailableResponse,
  getAuthenticatedUsername,
  parseBackendJson,
} from "./profile-api";

export async function GET() {
  const username = await getAuthenticatedUsername();

  if (!username) {
    return buildAuthErrorResponse();
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/`, {
      method: "GET",
      headers: buildAuthHeaders(username),
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Profile service returned an invalid response.");
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile service.");
  }
}

export async function POST(request) {
  const username = await getAuthenticatedUsername();

  if (!username) {
    return buildAuthErrorResponse();
  }

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

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/profile/`, {
      method: "POST",
      headers: buildAuthHeaders(username, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse, "Profile service returned an invalid response.");
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return buildUnavailableResponse("Unable to reach the backend profile service.");
  }
}
