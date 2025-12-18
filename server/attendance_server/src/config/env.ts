import dotenv from "dotenv";

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  packageId: string;
  systemObjectId: string; // AttendanceSystem object ID
  serverPrivateKey: string;
  network: "testnet" | "mainnet" | "devnet";
  logLevel: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function validateNetwork(network: string): "testnet" | "mainnet" | "devnet" {
  if (network !== "testnet" && network !== "mainnet" && network !== "devnet") {
    throw new Error(`Invalid NETWORK value: ${network}. Must be testnet, mainnet, or devnet`);
  }
  return network;
}

export function loadConfig(): Config {
  try {
    const config: Config = {
      port: parseInt(process.env.PORT || "4000", 10),
      nodeEnv: process.env.NODE_ENV || "development",
      packageId: getEnvVar("PACKAGE_ID"),
      systemObjectId: getEnvVar("SYSTEM_OBJECT_ID"),
      serverPrivateKey: getEnvVar("SERVER_PRIVATE_KEY"),
      network: validateNetwork(getEnvVar("NETWORK", "testnet")),
      logLevel: process.env.LOG_LEVEL || "info",
    };

    // Validate port
    if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
      throw new Error(`Invalid PORT value: ${process.env.PORT}`);
    }

    // Validate private key format (supports both bech32 and hex)
    const isBech32 = config.serverPrivateKey.startsWith("suiprivkey");
    const isHex = /^[0-9a-fA-F]{64}$/.test(config.serverPrivateKey);
    
    if (!isBech32 && !isHex) {
      console.error("Invalid private key format");
      console.error("Expected: 'suiprivkey1...' (bech32) or 64-char hex string");
      console.error("Got:", config.serverPrivateKey.substring(0, 20) + "...");
      throw new Error("SERVER_PRIVATE_KEY must be in bech32 or hex format");
    }

    return config;
  } catch (error) {
    console.error("Configuration error:", error);
    process.exit(1);
  }
}

export const config = loadConfig();








