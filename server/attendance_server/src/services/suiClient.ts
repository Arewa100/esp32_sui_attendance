import { SuiClient, getFullnodeUrl, EventId } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";
import { config } from "../config/env";
import { log } from "../utils/logger";

class SuiService {
  public client: SuiClient;
  public keypair: Ed25519Keypair;
  public address: string;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl(config.network) });

    // Decode Sui private key (to support bech32 format like suiprivkey1...)
    try {
      const parsed = decodeSuiPrivateKey(config.serverPrivateKey);
      this.keypair = Ed25519Keypair.fromSecretKey(parsed.secretKey);
    } catch (error) {
      log.error("Invalid SERVER_PRIVATE_KEY format");
      log.error("Expected: Sui bech32 format (suiprivkey1...) or hex");
      throw new Error("Failed to decode private key");
    }

    this.address = this.keypair.getPublicKey().toSuiAddress();

    log.info(`Sui client initialized`);
    log.info(`Network: ${config.network}`);
    log.info(`Server address: ${this.address}`);
  }

  /**
   * Sign and execute a transaction block
   */
  async executeTransaction(tx: Transaction) {
    try {
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (result.effects?.status?.status !== "success") {
        throw new Error(
          `Transaction failed: ${result.effects?.status?.error || "Unknown error"}`
        );
      }

      return result;
    } catch (error) {
      log.error("Transaction execution failed", error);
      throw error;
    }
  }

  /**
   * Get object details by ID
   */
  async getObject(objectId: string) {
    try {
      const response = await this.client.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      return response.data;
    } catch (error) {
      log.error(`Failed to get object ${objectId}`, error);
      throw error;
    }
  }

  /**
   * Query events from the smart contract
   */
  async queryEvents(query: any, limit = 50, cursor?: EventId) {
    try {
      const response = await this.client.queryEvents({
        query,
        limit,
        cursor: cursor || undefined,
      });

      return response;
    } catch (error) {
      log.error("Failed to query events", error);
      throw error;
    }
  }

  /**
   * Check if the server has enough balance for gas
   */
  async checkBalance(): Promise<bigint> {
    try {
      const balance = await this.client.getBalance({
        owner: this.address,
      });

      return BigInt(balance.totalBalance);
    } catch (error) {
      log.error("Failed to check balance", error);
      throw error;
    }
  }
}

// Singleton instance
export const suiService = new SuiService();

