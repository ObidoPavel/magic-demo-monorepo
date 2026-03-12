import {
  getKeycloakClientId,
  getKeycloakIssuer,
} from "@/lib/keycloak/config";

const KEYCLOAK_PKCE_VERIFIER_KEY = "keycloak_pkce_verifier";
const KEYCLOAK_PKCE_STATE_KEY = "keycloak_pkce_state";

const randomString = (size = 64): string => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

const toBase64Url = (input: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toBase64Url(digest);
};

const getCallbackUrl = (): string =>
  `${window.location.origin}/embedded-wallet/keycloak/callback`;

export const startKeycloakLogin = async (): Promise<void> => {
  const verifier = randomString(64);
  const challenge = await createCodeChallenge(verifier);
  const state = randomString(24);

  sessionStorage.setItem(KEYCLOAK_PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(KEYCLOAK_PKCE_STATE_KEY, state);

  const authUrl = new URL(`${getKeycloakIssuer()}/protocol/openid-connect/auth`);
  authUrl.searchParams.set("client_id", getKeycloakClientId());
  authUrl.searchParams.set("redirect_uri", getCallbackUrl());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  window.location.assign(authUrl.toString());
};

interface KeycloakTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
}

export const exchangeAuthorizationCode = async (
  code: string,
  state: string
): Promise<KeycloakTokenResponse> => {
  const storedState = sessionStorage.getItem(KEYCLOAK_PKCE_STATE_KEY);
  const verifier = sessionStorage.getItem(KEYCLOAK_PKCE_VERIFIER_KEY);

  if (!storedState || !verifier) {
    throw new Error("Missing PKCE verifier/state in browser session.");
  }

  if (storedState !== state) {
    throw new Error("Invalid Keycloak OAuth state.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getKeycloakClientId(),
    code,
    redirect_uri: getCallbackUrl(),
    code_verifier: verifier,
  });

  const response = await fetch(
    `${getKeycloakIssuer()}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to exchange Keycloak authorization code.");
  }

  sessionStorage.removeItem(KEYCLOAK_PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(KEYCLOAK_PKCE_STATE_KEY);

  return (await response.json()) as KeycloakTokenResponse;
};
