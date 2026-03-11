"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagicService } from "@/lib/embedded-wallet/get-magic";
import { Modal } from "@/components/Modal";
import { useConsole, LogType, LogMethod } from "@/contexts/ConsoleContext";
import { useEmailOTPModal } from "@/hooks/useEmailOTPModal";
import { Button } from "@/components/Button";

interface EmailOTPAuthProps {
  onSuccess?: () => void;
}

export function EmailOTPAuth({ onSuccess }: EmailOTPAuthProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { logToConsole } = useConsole();
  const router = useRouter();
  const {
    modalState,
    handleWhitelabelEmailOTPLogin: whitelabelLogin,
    closeModal,
    inputValue,
    setInputValue,
    errorMessage,
    setErrorMessage,
    isLoading: isLoadingModal,
  } = useEmailOTPModal();

  // Load persisted email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("magic_login_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Persist email to localStorage whenever it changes
  useEffect(() => {
    if (email) {
      localStorage.setItem("magic_login_email", email);
    }
  }, [email]);

  const handleSuccess = () => {
    // Redirect to wallet page after successful authentication using Next router
    router.push("/embedded-wallet/wallet");
    // Call the optional onSuccess callback if provided
    onSuccess?.();
  };

  const handleWhitelabelEmailOTPLogin = async () => {
    setIsLoading(true);
    try {
      await whitelabelLogin(email, handleSuccess, (error) => {
        logToConsole(
          LogType.ERROR,
          LogMethod.MAGIC_AUTH_LOGIN_WITH_EMAIL_OTP,
          error
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-5 max-w-[328px]">
      <h3 className="text-2xl font-bold my-6">Email OTP Login</h3>
      <div className="w-full flex flex-col gap-2">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 text-lg rounded-xl border bg-background border-slate-4 focus:ring-2 focus:ring-white/70 focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder-muted-foreground"
          disabled={isLoading}
        />

        <div className="w-full my-2">
          <Button
            onClick={handleWhitelabelEmailOTPLogin}
            variant="secondary"
            fullWidth
            className="flex flex-col gap-2"
          >
            <span>Whitelabel OTP</span>
            <span className="font-jetbrains font-normal text-sm text-secondary">
              showUI: false
            </span>
          </Button>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        retries={modalState.retries}
        maxRetries={modalState.maxRetries}
        inputValue={inputValue}
        setInputValue={setInputValue}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        isLoading={isLoadingModal}
        onSubmit={modalState.onSubmit}
        onCancel={modalState.onCancel}
        onClose={closeModal}
      />
    </div>
  );
}
