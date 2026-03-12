const DEFAULT_KEYCLOAK_BASE_URL = "http://localhost:8080";
const DEFAULT_KEYCLOAK_REALM = "jbpm-realm";
const DEFAULT_KEYCLOAK_CLIENT_ID = "react-app";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getKeycloakBaseUrl = (): string =>
  trimTrailingSlash(
    process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL ?? DEFAULT_KEYCLOAK_BASE_URL
  );

export const getKeycloakRealm = (): string =>
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? DEFAULT_KEYCLOAK_REALM;

export const getKeycloakClientId = (): string =>
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? DEFAULT_KEYCLOAK_CLIENT_ID;

export const getKeycloakIssuer = (): string =>
  `${getKeycloakBaseUrl()}/realms/${getKeycloakRealm()}`;

export const getKeycloakTokenIssuer = (): string =>
  process.env.KEYCLOAK_TOKEN_ISSUER ?? getKeycloakIssuer();
