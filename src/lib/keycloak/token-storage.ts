export interface KeycloakTokenSet {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
}

const KEYCLOAK_TOKEN_STORAGE_KEY = "keycloak_token_set";

const canAccessWindow = (): boolean => typeof window !== "undefined";

export const getStoredKeycloakTokens = (): KeycloakTokenSet | null => {
  if (!canAccessWindow()) {
    return null;
  }

  const raw = localStorage.getItem(KEYCLOAK_TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as KeycloakTokenSet;
  } catch {
    localStorage.removeItem(KEYCLOAK_TOKEN_STORAGE_KEY);
    return null;
  }
};

export const setStoredKeycloakTokens = (tokens: KeycloakTokenSet): void => {
  if (!canAccessWindow()) {
    return;
  }

  localStorage.setItem(KEYCLOAK_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearStoredKeycloakTokens = (): void => {
  if (!canAccessWindow()) {
    return;
  }

  localStorage.removeItem(KEYCLOAK_TOKEN_STORAGE_KEY);
};

export const isTokenSetStillValid = (tokens: KeycloakTokenSet): boolean => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  // 30s safety window to avoid using nearly expired tokens.
  return tokens.expiresAt > nowInSeconds + 30;
};
