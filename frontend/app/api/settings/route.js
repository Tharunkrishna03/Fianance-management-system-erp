import { NextResponse } from "next/server";

const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

async function parseBackendJson(response) {
  return response.json().catch(() => ({
    success: false,
    message: "Settings service returned an invalid response.",
  }));
}

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/settings/`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend settings service.",
      },
      { status: 503 },
    );
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

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/settings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend settings service.",
      },
      { status: 503 },
    );
  }
}
