// src/lib/wallet.ts
import { createWalletClient, createPublicClient, http, custom, parseEther, formatEther } from "viem";
import { STORY_AENEID } from "./chain";
import { DARKPOOL_ADDRESS, DARKPOOL_ABI } from "./constants";

export { formatEther };

export function getPublicClient() {
  return createPublicClient({
    chain: STORY_AENEID,
    transport: http(STORY_AENEID.rpcUrls.default.http[0]),
  });
}

export function getWalletClient() {
  if (!(window as any).ethereum) throw new Error("MetaMask not found");
  return createWalletClient({
    chain: STORY_AENEID,
    transport: custom((window as any).ethereum),
  });
}

export async function getAccount(): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const [address] = await wallet.getAddresses();
  return address;
}

export async function switchToAeneid() {
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x523" }],
    });
  } catch (e: any) {
    if (e.code === 4902) {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x523",
          chainName: "Story Aeneid Testnet",
          nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
          rpcUrls: ["https://aeneid.storyrpc.io"],
          blockExplorerUrls: ["https://aeneid.storyscan.io"],
        }],
      });
    }
  }
}

// ── Contract interactions ─────────────────────────────────────

export async function listDataset(
  vaultId: string,
  metadataURI: string,
  reserveEth: string,
  durationHours: number,
  royaltyBps: number = 500
) {
  await switchToAeneid();
  const wallet = getWalletClient();
  const account = await getAccount();
  const pub = getPublicClient();

  const hash = await wallet.writeContract({
    address: DARKPOOL_ADDRESS,
    abi: DARKPOOL_ABI,
    functionName: "list",
    args: [
  vaultId as `0x${string}`,
  metadataURI,
  parseEther(reserveEth),
  BigInt(durationHours * 3600),
  BigInt(royaltyBps),
],
    account,
    chain: STORY_AENEID,
  });

  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function placeBidOnChain(
  listingId: number,
  bidVaultId: string,
  depositEth: string
) {
  await switchToAeneid();
  const wallet = getWalletClient();
  const account = await getAccount();
  const pub = getPublicClient();

  const hash = await wallet.writeContract({
    address: DARKPOOL_ADDRESS,
    abi: DARKPOOL_ABI,
    functionName: "placeBid",
    args: [BigInt(listingId), bidVaultId as `0x${string}`],
    value: parseEther(depositEth),
    account,
    chain: STORY_AENEID,
  });

  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function revealBidOnChain(
  listingId: number,
  amount: bigint
) {
  await switchToAeneid();
  const wallet = getWalletClient();
  const account = await getAccount();
  const pub = getPublicClient();

  const hash = await wallet.writeContract({
    address: DARKPOOL_ADDRESS,
    abi: DARKPOOL_ABI,
    functionName: "revealBid",
    args: [BigInt(listingId), amount],
    account,
    chain: STORY_AENEID,
  });

  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function settleOnChain(listingId: number) {
  await switchToAeneid();
  const wallet = getWalletClient();
  const account = await getAccount();
  const pub = getPublicClient();

  const hash = await wallet.writeContract({
    address: DARKPOOL_ADDRESS,
    abi: DARKPOOL_ABI,
    functionName: "settle",
    args: [BigInt(listingId)],
    account,
    chain: STORY_AENEID,
  });

  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function getNextListingId(): Promise<number> {
  const pub = getPublicClient();
  const id = await pub.readContract({
    address: DARKPOOL_ADDRESS,
    abi: DARKPOOL_ABI,
    functionName: "nextListingId",
  }) as bigint;
  return Number(id);
}