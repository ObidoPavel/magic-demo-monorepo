import { MagicService } from "@/lib/embedded-wallet/get-magic";
import { TabsContent } from "@radix-ui/react-tabs";
import { SigningMethodsLayout } from "@/components/SigningMethodsLayout";
import {
  AccountId,
  Hbar,
  LocalProvider,
  PublicKey,
  SignerSignature,
  TransactionId,
  TransferTransaction,
  WebClient,
} from "@hashgraph/sdk";
import type {
  Executable,
  Signer as HederaSigner,
  Transaction as HederaTransaction,
} from "@hashgraph/sdk";

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
}

const HEDERA_SIGN_MESSAGE = "hello world";
const HEDERA_TRANSFER_TINYBARS = 1;
const HEDERA_TESTNET_NODE_ACCOUNT_ID = "0.0.3";
const HEDERA_TESTNET_TREASURY_ACCOUNT_ID = "0.0.98";

export function HederaSignMethods() {
  const createHederaClient = () => WebClient.forTestnet();

  const resolveHederaAccountId = async (): Promise<AccountId> => {
    const hederaAddressPayload = await MagicService.magic.hedera.getPublicAddress();

    if (
      hederaAddressPayload &&
      typeof hederaAddressPayload === "object" &&
      "accountId" in hederaAddressPayload
    ) {
      const accountId = (hederaAddressPayload as Record<string, unknown>).accountId;
      if (typeof accountId === "string" && accountId.includes(".")) {
        return AccountId.fromString(accountId);
      }
    }

    if (
      typeof hederaAddressPayload === "string" &&
      hederaAddressPayload.includes(".")
    ) {
      return AccountId.fromString(hederaAddressPayload);
    }

    const evmAddressCandidates =
      typeof hederaAddressPayload === "string"
        ? [hederaAddressPayload]
        : hederaAddressPayload && typeof hederaAddressPayload === "object"
        ? [
            (hederaAddressPayload as Record<string, unknown>).publicAddress,
            (hederaAddressPayload as Record<string, unknown>).address,
          ]
        : [];

    const evmAddress = evmAddressCandidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.trim().startsWith("0x")
    );

    if (!evmAddress) {
      throw new Error(
        "Unable to resolve Hedera account id from Magic response. Expected accountId (0.0.x) or EVM address."
      );
    }

    const client = createHederaClient();
    const accountIdFromEvm = AccountId.fromEvmAddress(0, 0, evmAddress);
    const populatedAccountId = await accountIdFromEvm.populateAccountNum(client);
    client.close();
    return populatedAccountId;
  };

  const createMagicSigner = async (): Promise<{
    signer: HederaSigner;
    accountId: AccountId;
  }> => {
    const client = createHederaClient();
    const provider = LocalProvider.fromClient(client);
    const accountId = await resolveHederaAccountId();
    const { publicKeyDer } = await MagicService.magic.hedera.getPublicKey();

    if (!publicKeyDer) {
      client.close();
      throw new Error("Hedera public key is unavailable for transaction signing");
    }

    const publicKey = PublicKey.fromString(publicKeyDer);

    const signer: HederaSigner = {
      getLedgerId: () => provider.getLedgerId(),
      getAccountId: () => accountId,
      getAccountKey: () => publicKey,
      getNetwork: () => provider.getNetwork(),
      getMirrorNetwork: () => provider.getMirrorNetwork(),
      sign: async (messages: Uint8Array[]) =>
        Promise.all(
          messages.map(async (message) => {
            const signature = await MagicService.magic.hedera.sign(message);
            return new SignerSignature({
              publicKey,
              signature,
              accountId,
            });
          })
        ),
      getAccountBalance: () => provider.getAccountBalance(accountId),
      getAccountInfo: () => provider.getAccountInfo(accountId),
      getAccountRecords: () => provider.getAccountRecords(accountId),
      signTransaction: async <T extends HederaTransaction>(
        transaction: T
      ): Promise<T> =>
        transaction.signWith(
          publicKey,
          async (message: Uint8Array): Promise<Uint8Array> =>
            MagicService.magic.hedera.sign(message)
        ),
      checkTransaction: async <T extends HederaTransaction>(
        transaction: T
      ): Promise<T> => transaction,
      populateTransaction: async <T extends HederaTransaction>(
        transaction: T
      ): Promise<T> => transaction,
      call: async <RequestT, ResponseT, OutputT>(
        request: Executable<RequestT, ResponseT, OutputT>
      ): Promise<OutputT> => provider.call(request),
    };

    return { signer, accountId };
  };

  const handleGetPublicAddress = async (): Promise<string> => {
    const magic = MagicService.magic;
    const response = await magic.hedera.getPublicAddress();

    if (typeof response === "string" && response.trim().length > 0) {
      return response;
    }

    if (response && typeof response === "object") {
      const payload = response as Record<string, unknown>;
      const addressCandidates = [
        payload.publicAddress,
        payload.address,
        payload.accountId,
      ];

      for (const candidate of addressCandidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
          return candidate;
        }
      }

      return JSON.stringify(payload, null, 2);
    }

    throw new Error("Hedera public address is unavailable");
  };

  const handleGetPublicKey = async (): Promise<string> => {
    const magic = MagicService.magic;
    const { publicKeyDer } = await magic.hedera.getPublicKey();
    if (!publicKeyDer) {
      throw new Error("Hedera public key is unavailable");
    }
    return publicKeyDer;
  };

  const handleSignMessage = async (): Promise<string> => {
    const magic = MagicService.magic;
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(HEDERA_SIGN_MESSAGE);
    const sigUint8Array = await magic.hedera.sign(uint8Array);

    const base64String = uint8ArrayToBase64(sigUint8Array);
    return base64String;
  };

  const handleTransferTransaction = async (): Promise<string> => {
    const { signer, accountId } = await createMagicSigner();
    const recipient = AccountId.fromString(HEDERA_TESTNET_TREASURY_ACCOUNT_ID);

    const transferTx = new TransferTransaction()
      .setTransactionId(TransactionId.generate(accountId))
      .setNodeAccountIds([AccountId.fromString(HEDERA_TESTNET_NODE_ACCOUNT_ID)])
      .addHbarTransfer(accountId, Hbar.fromTinybars(-HEDERA_TRANSFER_TINYBARS))
      .addHbarTransfer(recipient, Hbar.fromTinybars(HEDERA_TRANSFER_TINYBARS))
      .setTransactionMemo("Magic Hedera TransferTransaction demo");

    const frozenTx = transferTx.freeze();
    const signedTx = await frozenTx.signWithSigner(signer);
    const response = await signedTx.executeWithSigner(signer);
    const receipt = await response.getReceiptWithSigner(signer);

    return JSON.stringify(
      {
        status: receipt.status.toString(),
        transactionId: response.transactionId.toString(),
        fromAccountId: accountId.toString(),
        toAccountId: recipient.toString(),
        amountTinybar: HEDERA_TRANSFER_TINYBARS,
      },
      null,
      2
    );
  };


  const tabs = [
    {
      value: "public-address",
      label: "Get Public Address",
      functionName: "magic.hedera.getPublicAddress()",
      payload: null,
      handler: handleGetPublicAddress,
    },
    { 
      value: "public-key", 
      label: "Get Public Key", 
      functionName: "magic.hedera.getPublicKey()",
      payload: null,
      handler: handleGetPublicKey
    },
    { 
      value: "sign-message", 
      label: "Sign Message", 
      functionName: "magic.hedera.sign(message)",
      payload: HEDERA_SIGN_MESSAGE,
      handler: handleSignMessage
    },
    {
      value: "transfer-transaction",
      label: "Transfer Transaction",
      functionName:
        "new TransferTransaction().freezeWithSigner(signer).signWithSigner(signer).executeWithSigner(signer)",
      payload: {
        network: "testnet",
        from: "resolved_magic_hedera_account_id",
        to: HEDERA_TESTNET_TREASURY_ACCOUNT_ID,
        amountTinybar: HEDERA_TRANSFER_TINYBARS,
      },
      handler: handleTransferTransaction,
    },
  ];

  return (
    <div className="space-y-4">
      <SigningMethodsLayout
        title="Hedera Signing Methods"
        description="Test Hedera-native methods and a real TransferTransaction using Magic signer"
        defaultTab="public-key"
        tabs={tabs}
      >
        <TabsContent value="public-address" />
        <TabsContent value="public-key" />
        <TabsContent value="sign-message" />
        <TabsContent value="transfer-transaction" />
      </SigningMethodsLayout>
    </div>
  );
}
