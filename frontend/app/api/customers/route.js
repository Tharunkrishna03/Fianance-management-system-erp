import { NextResponse } from "next/server";

const BACKEND_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

async function parseBackendJson(response) {
  return response.json().catch(() => ({
    success: false,
    message: "Customer service returned an invalid response.",
  }));
}

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse);

    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend customer service.",
      },
      { status: 503 },
    );
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

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/`, {
      method: "POST",
      body: backendFormData,
      cache: "no-store",
    });

    const data = await parseBackendJson(backendResponse);

    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the backend customer service.",
      },
      { status: 503 },
    );
  }
}
