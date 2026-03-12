"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { exchangeAuthorizationCode } from "@/lib/keycloak/oauth";
import { setStoredKeycloakTokens } from "@/lib/keycloak/token-storage";

export default function KeycloakCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      router.replace("/embedded-wallet");
      return;
    }

    if (!code || !state) {
      router.replace("/embedded-wallet");
      return;
    }

    void exchangeAuthorizationCode(code, state)
      .then((tokenResponse) => {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        setStoredKeycloakTokens({
          accessToken: tokenResponse.access_token,
          idToken: tokenResponse.id_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: nowInSeconds + tokenResponse.expires_in,
        });
        router.replace("/embedded-wallet");
      })
      .catch(() => {
        router.replace("/embedded-wallet");
      });
  }, [router, searchParams]);

  return <LoadingScreen message="Completing Keycloak sign-in..." />;
}
