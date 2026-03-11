"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { MagicService } from "@/lib/embedded-wallet/get-magic";
import { useConsole, LogType, LogMethod } from "./ConsoleContext";

export enum Network {
  POLYGON = "polygon",
  ETHEREUM = "ethereum",
  OPTIMISM = "optimism",
  HEDERA = "hedera",
  SOLANA = "solana",
}

interface WalletContextType {
  publicAddress: string | null;
  hederaAccountId: string | null;
  selectedNetwork: Network;
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: any | null;
  handleNetworkChange: (network: Network) => void;
  handleLogout: () => Promise<void>;
  fetchAllNetworkAddresses: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const pickAddressFromValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [
      obj.publicAddress,
      obj.address,
      obj.evmAddress,
      obj.accountId,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return null;
};

const pickHederaAccountIdFromValue = (value: unknown): string | null => {
  if (typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value.trim())) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.accountId, obj.publicAddress, obj.address];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && /^\d+\.\d+\.\d+$/.test(candidate.trim())) {
        return candidate.trim();
      }
    }
  }

  return null;
};

const resolveHederaAccountIdFromMirror = async (
  evmOrAlias: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmOrAlias}`
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { account?: unknown };
    if (typeof data.account === "string" && /^\d+\.\d+\.\d+$/.test(data.account)) {
      return data.account;
    }
  } catch {
    // Ignore Mirror Node lookup failures and keep available wallet metadata.
  }

  return null;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(Network.HEDERA);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const { logToConsole } = useConsole();
  const router = useRouter();

  // Helper function to get public address from userInfo based on selected network
  const getPublicAddress = (): string | null => {
    if (!userInfo?.wallets) return null;
    const wallets = userInfo.wallets as Record<string, unknown>;

    // EVM networks (polygon, ethereum, optimism) all use the ethereum wallet
    if (
      [Network.POLYGON, Network.ETHEREUM, Network.OPTIMISM].includes(
        selectedNetwork
      )
    ) {
      return pickAddressFromValue(wallets.ethereum);
    }

    if (selectedNetwork === Network.HEDERA) {
      return (
        pickAddressFromValue(wallets.hedera) ||
        pickAddressFromValue(wallets.ethereum) ||
        null
      );
    }

    // Other networks use their own wallet.
    return pickAddressFromValue(wallets[selectedNetwork]);
  };

  const getHederaAccountId = (): string | null => {
    if (!userInfo?.wallets) return null;
    const wallets = userInfo.wallets as Record<string, unknown>;

    return (
      pickHederaAccountIdFromValue(wallets.hedera) ||
      pickHederaAccountIdFromValue(wallets.ethereum) ||
      null
    );
  };

  const fetchAllNetworkAddresses = async () => {
    try {
      const fetchedUserInfo = await MagicService.magic.user.getInfo();
      let enrichedUserInfo = fetchedUserInfo;

      // Hedera-only mode can return wallet data without publicAddress in user.getInfo().
      // Query extension directly and merge Hedera fields for UI rendering.
      if (selectedNetwork === Network.HEDERA) {
        try {
          const hederaAddressPayload =
            await MagicService.magic.hedera.getPublicAddress();
          const hederaPayload =
            typeof hederaAddressPayload === "object" && hederaAddressPayload
              ? (hederaAddressPayload as Record<string, unknown>)
              : {};
          const existingWallets = (fetchedUserInfo?.wallets ?? {}) as Record<
            string,
            unknown
          >;
          const existingHederaWallet =
            existingWallets.hedera && typeof existingWallets.hedera === "object"
              ? (existingWallets.hedera as Record<string, unknown>)
              : {};

          const fallbackAddress = pickAddressFromValue(hederaAddressPayload);
          const existingAccountId = pickHederaAccountIdFromValue(existingHederaWallet);
          const payloadAccountId = pickHederaAccountIdFromValue(hederaPayload);
          const mirrorResolvedAccountId =
            !existingAccountId && !payloadAccountId && fallbackAddress
              ? await resolveHederaAccountIdFromMirror(fallbackAddress)
              : null;

          enrichedUserInfo = {
            ...fetchedUserInfo,
            wallets: {
              ...existingWallets,
              hedera: {
                ...existingHederaWallet,
                publicAddress:
                  fallbackAddress ||
                  (typeof existingHederaWallet.publicAddress === "string"
                    ? existingHederaWallet.publicAddress
                    : null),
                accountId:
                  payloadAccountId ||
                  existingAccountId ||
                  mirrorResolvedAccountId ||
                  (typeof hederaPayload.accountId === "string"
                    ? hederaPayload.accountId
                    : null),
                address:
                  typeof hederaPayload.address === "string"
                    ? hederaPayload.address
                    : typeof existingHederaWallet.address === "string"
                    ? existingHederaWallet.address
                    : null,
                evmAddress:
                  typeof hederaPayload.evmAddress === "string"
                    ? hederaPayload.evmAddress
                    : typeof existingHederaWallet.evmAddress === "string"
                    ? existingHederaWallet.evmAddress
                    : null,
              },
            },
          };
        } catch (hederaAddressError) {
          logToConsole(
            LogType.WARNING,
            LogMethod.MAGIC_USER_GET_INFO,
            "Unable to resolve Hedera address from hedera extension fallback",
            hederaAddressError
          );
        }
      }

      logToConsole(
        LogType.INFO,
        LogMethod.MAGIC_USER_GET_INFO,
        "User info fetched",
        enrichedUserInfo
      );

      // Store user info for other components to use
      setUserInfo(enrichedUserInfo);
      logToConsole(
        LogType.SUCCESS,
        LogMethod.MAGIC_USER_GET_INFO,
        "User info and wallets fetched successfully",
        enrichedUserInfo
      );
    } catch (error) {
      logToConsole(
        LogType.ERROR,
        LogMethod.MAGIC_USER_GET_INFO,
        "Error fetching user info",
        error
      );
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      logToConsole(
        LogType.INFO,
        LogMethod.MAGIC_USER_IS_LOGGED_IN,
        "Checking authentication status..."
      );
      const isLoggedIn = await MagicService.magic.user.isLoggedIn();
      if (isLoggedIn) {
        setIsAuthenticated(true);
        await fetchAllNetworkAddresses();
      } else {
        setIsAuthenticated(false);
        logToConsole(
          LogType.INFO,
          LogMethod.MAGIC_USER_IS_LOGGED_IN,
          "User is not authenticated, redirecting to embedded-wallet page"
        );
        router.push("/embedded-wallet");
      }
    } catch (error: unknown) {
      const err = error as Error;
      setIsAuthenticated(false);
      logToConsole(
        LogType.ERROR,
        LogMethod.MAGIC_USER_IS_LOGGED_IN,
        "Error checking auth status",
        err.message
      );
      console.error("Error checking auth status:", error);
      router.push("/embedded-wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // POC behavior: force Hedera regardless of previous localStorage selection.
    setSelectedNetwork(Network.HEDERA);
    checkAuthStatus();
  }, []);

  const handleNetworkChange = (network: Network) => {
    const nextNetwork = network === Network.HEDERA ? network : Network.HEDERA;
    setSelectedNetwork(nextNetwork);

    // Log the network change
    logToConsole(
      LogType.SUCCESS,
      LogMethod.MAGIC_USER_GET_INFO,
      `Network changed to: ${nextNetwork}`
    );
  };

  const handleLogout = async () => {
    try {
      logToConsole(
        LogType.INFO,
        LogMethod.MAGIC_USER_LOGOUT,
        "Logging out user..."
      );
      const res = await MagicService.magic.user.logout();
      if (res) {
        setIsAuthenticated(false);
        setUserInfo(null);
        localStorage.removeItem("magic_widget_login_method");
        logToConsole(
          LogType.SUCCESS,
          LogMethod.MAGIC_USER_LOGOUT,
          "User logged out successfully"
        );
        router.replace("/embedded-wallet");
      }
    } catch (error) {
      logToConsole(
        LogType.ERROR,
        LogMethod.MAGIC_USER_LOGOUT,
        "Logout error",
        error
      );
      console.error("Logout error:", error);
    }
  };

  const value: WalletContextType = {
    publicAddress: getPublicAddress(),
    hederaAccountId: getHederaAccountId(),
    selectedNetwork,
    isAuthenticated,
    isLoading,
    userInfo,
    handleNetworkChange,
    handleLogout,
    fetchAllNetworkAddresses,
    checkAuthStatus,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useEmbeddedWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useEmbeddedWallet must be used within a WalletProvider");
  }
  return context;
}
