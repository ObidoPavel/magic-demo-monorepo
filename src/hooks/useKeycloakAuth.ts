"use client";

import { useCallback, useEffect, useState } from "react";
import { startKeycloakLogin } from "@/lib/keycloak/oauth";
import {
  clearStoredKeycloakTokens,
  getStoredKeycloakTokens,
  isTokenSetStillValid,
} from "@/lib/keycloak/token-storage";

type KeycloakAuthStatus = "loading" | "authenticated" | "unauthenticated";

export const useKeycloakAuth = () => {
  const [status, setStatus] = useState<KeycloakAuthStatus>("loading");

  const refreshStatus = useCallback(async () => {
    const tokens = getStoredKeycloakTokens();

    if (!tokens || !isTokenSetStillValid(tokens)) {
      clearStoredKeycloakTokens();
      setStatus("unauthenticated");
      return;
    }

    try {
      const response = await fetch("/api/keycloak/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        clearStoredKeycloakTokens();
        setStatus("unauthenticated");
        return;
      }

      setStatus("authenticated");
    } catch {
      clearStoredKeycloakTokens();
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loginWithKeycloak: startKeycloakLogin,
    refreshStatus,
    clearAuth: clearStoredKeycloakTokens,
  };
};
