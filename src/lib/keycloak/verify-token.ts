import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";
import {
  getKeycloakClientId,
  getKeycloakIssuer,
  getKeycloakTokenIssuer,
} from "@/lib/keycloak/config";

const keycloakJwks = createRemoteJWKSet(
  new URL(`${getKeycloakIssuer()}/protocol/openid-connect/certs`)
);

const getTokenFromAuthHeader = (authorizationHeader: string): string | null => {
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
};

const isExpectedAudience = (payload: JWTPayload): boolean => {
  const clientId = getKeycloakClientId();
  const aud = payload.aud;

  if (typeof aud === "string" && aud === clientId) {
    return true;
  }

  if (Array.isArray(aud) && aud.includes(clientId)) {
    return true;
  }

  if (payload.azp === clientId || payload.client_id === clientId) {
    return true;
  }

  return false;
};

export const verifyKeycloakToken = async (token: string): Promise<JWTPayload> => {
  const acceptedIssuers = Array.from(
    new Set([getKeycloakTokenIssuer(), getKeycloakIssuer()])
  );

  const { payload } = await jwtVerify(token, keycloakJwks, {
    issuer: acceptedIssuers,
  });

  if (!isExpectedAudience(payload)) {
    throw new Error("Invalid token audience");
  }

  return payload;
};

export const verifyAuthorizationHeader = async (
  authorizationHeader: string | null
): Promise<{ token: string; payload: JWTPayload } | null> => {
  if (!authorizationHeader) {
    return null;
  }

  const token = getTokenFromAuthHeader(authorizationHeader);
  if (!token) {
    return null;
  }

  const payload = await verifyKeycloakToken(token);
  return { token, payload };
};
