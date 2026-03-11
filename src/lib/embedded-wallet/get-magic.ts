import { Magic } from "magic-sdk";
import { HederaExtension } from "@magic-ext/hedera";
import { ethers } from "ethers";

export class MagicService {
  private static _magic: any = null;
  private static _provider: ethers.BrowserProvider | null = null;

  public static get magic(): any {
    if (!this._magic) {
      this._magic = new Magic(
        process.env.NEXT_PUBLIC_MAGIC_EMBEDDED_WALLET_KEY ?? "",
        {
          extensions: [
            new HederaExtension({
              network: "testnet",
            }),
          ],
        }
      );
    }
    return this._magic;
  }

  public static get provider(): ethers.BrowserProvider {
    if (!this._provider) {
      this._provider = new ethers.BrowserProvider(
        // cast as any if necessary; Magic's rpcProvider type is slightly different
        MagicService.magic.rpcProvider as any
      );
    }
    return this._provider;
  }
}
