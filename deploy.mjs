import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const AENEID = {
  id: 1315,
  name: "Story Aeneid Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: ["https://aeneid.storyrpc.io"] } },
};

const artifact = JSON.parse(
  readFileSync("./artifacts/contracts/DarkPoolAuction.sol/DarkPoolAuction.json", "utf8")
);

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

const walletClient = createWalletClient({
  account,
  chain: AENEID,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: AENEID,
  transport: http(),
});

console.log("Deploying from:", account.address);

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});

console.log("Transaction hash:", hash);
console.log("Waiting for confirmation...");

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log("Contract deployed at:", receipt.contractAddress);