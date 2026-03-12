import { express } from "@/lib/server-wallet/express";
import { TeeEndpoint } from "@/types/tee-types";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyAuthorizationHeader } from "@/lib/keycloak/verify-token";

// POST /api/tee/wallet/sign/message → forwards to POST /v1/wallet/sign/message
export async function POST(req: Request) {
  try {
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
      upstreamToken = session.idToken;
    }

    const body = await req.text();
    const res = await express(TeeEndpoint.SIGN_MESSAGE, upstreamToken, {
      method: "POST",
      body,
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error("POST sign message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
