"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmailOTPAuth } from "@/components/embedded-wallet/auth/EmailOTPAuth";
import { useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  const { isAuthenticated, isLoading, fetchAllNetworkAddresses } =
    useEmbeddedWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/embedded-wallet/wallet");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Don't render the auth form if user is authenticated (redirect will happen)
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
