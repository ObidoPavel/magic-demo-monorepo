import { MethodsCard } from "@/components/MethodsCard";
import { Network, useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { MagicService } from "@/lib/embedded-wallet/get-magic";
import { useEffect, useState } from "react";

export function UserMethods() {
  const { selectedNetwork } = useEmbeddedWallet();
  const [isWalletLogin, setIsWalletLogin] = useState(false);

  useEffect(() => {
    setIsWalletLogin(
      localStorage.getItem("magic_widget_login_method") === "wallet"
    );
  }, []);
  const evmNetworks = [Network.POLYGON, Network.ETHEREUM, Network.OPTIMISM];
  const showEvmMethods = evmNetworks.includes(selectedNetwork);
  const capitalNetworkName =
    selectedNetwork[0].toUpperCase() + selectedNetwork.slice(1);

  const revealPrivateKeyTab = showEvmMethods
    ? {
        value: "reveal-private-key",
        label: "Reveal EVM Private Key",
        functionName: "magic.user.revealEVMPrivateKey()",
        payload: null,
        handler: () => MagicService.magic.user.revealEVMPrivateKey(),
        disabled: isWalletLogin,
      }
    : {
        value: "reveal-private-key",
        label: `Reveal ${capitalNetworkName} Private Key`,
        functionName: `magic.${selectedNetwork}.revealPrivateKey()`,
        payload: null,
        handler: () => MagicService.magic[selectedNetwork].revealPrivateKey(),
        disabled: isWalletLogin,
      };

  const persistDidToken = (token: unknown) => {
    if (typeof window === "undefined") {
      return;
    }
    if (typeof token === "string" && token.length > 0) {
      localStorage.setItem("magic_last_did_token", token);
    }
  };

  const getPersistedDidToken = (): string | null => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("magic_last_did_token");
  };

  const resolveIdTokenWithFallback = async (
    primary: () => Promise<string>,
    secondary: () => Promise<string>
  ): Promise<string> => {
    const sleep = (ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const warmupHederaWallet = async () => {
      // Some Hedera sessions need wallet hydration before User module token calls succeed.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await MagicService.magic.user.getInfo();
        await MagicService.magic.hedera.getPublicAddress();
        await MagicService.magic.hedera.getPublicKey();
        await sleep(350 * (attempt + 1));
      }
    };

    try {
      const token = await primary();
      persistDidToken(token);
      return token;
    } catch (primaryError) {
      const primaryMessage =
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError);
      if (!primaryMessage.includes("Failed to get wallet")) {
        throw primaryError;
      }

      try {
        await warmupHederaWallet();
        const token = await secondary();
        persistDidToken(token);
        return token;
      } catch (secondaryError) {
        const secondaryMessage =
          secondaryError instanceof Error
            ? secondaryError.message
            : String(secondaryError);
        const cachedToken = getPersistedDidToken();

        if (cachedToken) {
          return JSON.stringify(
            {
              source: "cached",
              warning:
                "Returned last successful DID token because wallet lookup failed in current session.",
              token: cachedToken,
              errors: {
                primary: primaryMessage,
                secondary: secondaryMessage,
              },
            },
            null,
            2
          );
        }

        return JSON.stringify(
          {
            source: "unavailable",
            warning:
              "ID token could not be generated because wallet resolution failed after Hedera wallet warmup retries in this session.",
            errors: {
              primary: primaryMessage,
              secondary: secondaryMessage,
            },
          },
          null,
          2
        );
      }
    }
  };

  const handleGetIdToken = async () => {
    return resolveIdTokenWithFallback(
      () => MagicService.magic.user.getIdToken(),
      () => MagicService.magic.user.generateIdToken()
    );
  };

  const handleGenerateIdToken = async () => {
    return resolveIdTokenWithFallback(
      () => MagicService.magic.user.generateIdToken(),
      () => MagicService.magic.user.getIdToken()
    );
  };

  const tabs = [
    {
      value: "is-logged-in",
      label: "Is Logged In",
      functionName: "magic.user.isLoggedIn()",
      payload: null,
      handler: () => MagicService.magic.user.isLoggedIn(),
    },
    {
      value: "get-info",
      label: "Get Info",
      functionName: "magic.user.getInfo()",
      payload: null,
      handler: () => MagicService.magic.user.getInfo(),
    },
    {
      value: "logout",
      label: "Logout",
      functionName: "magic.user.logout()",
      payload: null,
      handler: () => MagicService.magic.user.logout(),
    },
    {
      value: "get-id-token",
      label: "Get ID Token",
      functionName: "magic.user.getIdToken()",
      payload: null,
      handler: handleGetIdToken,
      disabled: isWalletLogin,
    },
    {
      value: "generate-id-token",
      label: "Generate ID Token",
      functionName: "magic.user.generateIdToken()",
      payload: null,
      handler: handleGenerateIdToken,
      disabled: isWalletLogin,
    },
    {
      value: "show-settings",
      label: "Show Settings",
      functionName: "magic.user.showSettings()",
      payload: null,
      handler: () => MagicService.magic.user.showSettings(),
      disabled: isWalletLogin,
    },
    // {
    //   value: "recover-account",
    //   label: "Recover Account",
    //   functionName: "magic.user.recoverAccount()",
    //   payload: null,
    //   handler: () =>
    //     MagicService.magic.user.getInfo().then((user: MagicUserMetadata) =>
    //       MagicService.magic.user
    //         .logout()
    //         .then(() =>
    //           MagicService.magic.user.recoverAccount({ email: user.email })
    //         )
    //         .catch((error: unknown) => {
    //           logToConsole(
    //             LogType.ERROR,
    //             LogMethod.MAGIC_USER_RECOVER_ACCOUNT,
    //             "Error recovering account",
    //             error
    //           );
    //           logToConsole(
    //             LogType.INFO,
    //             LogMethod.MAGIC_USER_RECOVER_ACCOUNT,
    //             "Redirecting to auth page"
    //           );
    //           router.push("/embedded-wallet");
    //         })
    //     ),
    // },
    revealPrivateKeyTab,
  ];

  return (
    <MethodsCard
      title="User Methods"
      description="Test various user methods with Magic SDK"
      defaultTab={tabs[0].value}
      tabs={tabs}
    />
  );
}
