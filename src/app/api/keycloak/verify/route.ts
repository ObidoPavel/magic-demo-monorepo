import { NextResponse } from "next/server";
import { verifyAuthorizationHeader } from "@/lib/keycloak/verify-token";

export async function GET(request: Request) {
  try {
    const verified = await verifyAuthorizationHeader(
      request.headers.get("authorization")
    );

    if (!verified) {
      return NextResponse.json(
        { error: "Missing or invalid bearer token." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      subject: verified.payload.sub,
      username: verified.payload.preferred_username,
      exp: verified.payload.exp,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Keycloak token." },
      { status: 401 }
    );
  }
}
