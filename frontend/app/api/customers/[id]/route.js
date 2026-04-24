import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildAuthErrorResponse,
  buildBackendHeaders,
  buildUnavailableResponse,
  parseBackendJson,
  syncBackendAuthCookies,
} from "@/lib/backend-auth";

async function getCustomerId(params) {
  const resolvedParams = await params;
  return resolvedParams.id;
}

export async function GET(request, { params }) {
  const backendHeaders = await buildBackendHeaders(request);

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const customerId = await getCustomerId(params);
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/${customerId}/`, {
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

export async function POST(request, { params }) {
  const customerId = await getCustomerId(params);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let payload;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Customer transaction data could not be read.",
        },
        { status: 400 },
      );
    }

    try {
      const backendHeaders = await buildBackendHeaders(
        request,
        { "Content-Type": "application/json" },
        { includeCsrf: true },
      );

      if (!backendHeaders) {
        return buildAuthErrorResponse();
      }

      const backendResponse = await fetch(`${BACKEND_URL}/api/customers/${customerId}/`, {
        method: "POST",
        headers: backendHeaders,
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await parseBackendJson(backendResponse, "Customer service returned an invalid response.");
      const response = NextResponse.json(data, { status: backendResponse.status });
      return syncBackendAuthCookies(response, backendResponse);
    } catch {
      return buildUnavailableResponse("Unable to reach the backend customer service.");
    }
  }

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
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/${customerId}/`, {
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

export async function DELETE(request, { params }) {
  const backendHeaders = await buildBackendHeaders(request, {}, { includeCsrf: true });

  if (!backendHeaders) {
    return buildAuthErrorResponse();
  }

  try {
    const customerId = await getCustomerId(params);
    const backendResponse = await fetch(`${BACKEND_URL}/api/customers/${customerId}/`, {
      method: "DELETE",
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
