"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmailOTPAuth } from "@/components/embedded-wallet/auth/EmailOTPAuth";
import { useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { useKeycloakAuth } from "@/hooks/useKeycloakAuth";

export default function Home() {
  const { isAuthenticated, isLoading, fetchAllNetworkAddresses } =
    useEmbeddedWallet();
  const { status: keycloakStatus, loginWithKeycloak } = useKeycloakAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      keycloakStatus === "authenticated" &&
      !isLoading &&
      isAuthenticated
    ) {
      router.replace("/embedded-wallet/wallet");
    }
  }, [isAuthenticated, isLoading, keycloakStatus, router]);

  // Show loading state while checking Keycloak and Magic authentication.
  if (keycloakStatus === "loading" || isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (keycloakStatus !== "authenticated") {
    return (
      <div className="flex flex-col items-center gap-12 sm:pt-12">
        <PageHeader
          product="Embedded Wallet"
          title="Authenticate with Keycloak"
          description="Sign in with Keycloak first, then continue with Magic wallet auth."
        />
        <Button onClick={() => void loginWithKeycloak()}>
          Continue with Keycloak
        </Button>
      </div>
    );
  }

  // Don't render the auth form if user is authenticated (redirect will happen).
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 flex flex-col items-center min-h-screen pt-0 sm:pt-12 pb-20 gap-10 sm:gap-16 sm:p-10 sm:pr-4 lg:p-20">
        {/* Header */}
        <div className="p-8">
          <PageHeader
            product="Embedded Wallet"
            title="Get Started"
            description="Connect your account using Magic's embedded wallet authentication"
          />
        </div>

        <div className="flex flex-col [@media(min-width:1070px)]:flex-row justify-center items-center [@media(min-width:1070px)]:items-start gap-20 w-full">
          <div className="flex flex-col items-center gap-10 w-full max-w-[400px]">
            {/* Email OTP Authentication */}
            <EmailOTPAuth onSuccess={fetchAllNetworkAddresses} />
          </div>
        </div>
      </div>
    </div>
  );
}
