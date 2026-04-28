import { NextResponse } from "next/server";

const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

async function parseBackendJson(response) {
  return response.json().catch(() => ({
    success: false,
    message: "Demo credential service returned an invalid response.",
  }));
}

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/login/demo/`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend demo credential service.",
      },
      { status: 503 },
    );
  }
}
