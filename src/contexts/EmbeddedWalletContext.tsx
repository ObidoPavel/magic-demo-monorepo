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

  const fetchAllNetworkAddresses = async () => {
    try {
      const fetchedUserInfo = await MagicService.magic.user.getInfo();
      let enrichedUserInfo = fetchedUserInfo;

      // Hedera-only mode can return wallet data without publicAddress in user.getInfo().
      // Query extension directly and merge address fields for UI rendering.
      if (
        selectedNetwork === Network.HEDERA &&
        !pickAddressFromValue(fetchedUserInfo?.wallets?.hedera) &&
        !pickAddressFromValue(fetchedUserInfo?.wallets?.ethereum)
      ) {
        try {
          const hederaAddressPayload =
            await MagicService.magic.hedera.getPublicAddress();
          const fallbackAddress = pickAddressFromValue(hederaAddressPayload);

          if (fallbackAddress) {
            enrichedUserInfo = {
              ...fetchedUserInfo,
              wallets: {
                ...(fetchedUserInfo?.wallets ?? {}),
                hedera: {
                  ...(fetchedUserInfo?.wallets?.hedera ?? {}),
                  publicAddress: fallbackAddress,
                },
              },
            };
          }
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
