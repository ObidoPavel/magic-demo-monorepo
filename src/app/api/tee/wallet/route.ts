import { getServerSession } from "next-auth";
import { TeeEndpoint } from "@/types/tee-types";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { express } from "@/lib/server-wallet/express";
import { verifyAuthorizationHeader } from "@/lib/keycloak/verify-token";

export async function POST(req: Request) {
  let upstreamToken: string | null = null;

  const authorizationHeader = req.headers.get("authorization");
  if (authorizationHeader) {
    try {
      const verified = await verifyAuthorizationHeader(authorizationHeader);
      if (!verified) {
        return NextResponse.json(
          { error: "Invalid bearer token." },
          { status: 401 }
        );
      }
      upstreamToken = verified.token;
    } catch {
      return NextResponse.json(
        { error: "Invalid Keycloak token." },
        { status: 401 }
      );
    }
  }

  if (!upstreamToken) {
    const session = await getServerSession(authOptions);

    if (!session?.idToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if there was an error refreshing the token
    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        {
          error: "Token refresh failed. Please sign in again.",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    upstreamToken = session.idToken;
  }

  const body = await req.text();
  const res = await express(TeeEndpoint.WALLET, upstreamToken, {
    method: "POST",
    body,
  });

  return NextResponse.json(res);
}
