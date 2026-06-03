// src/lib/constants.ts

export const DARKPOOL_ADDRESS = "0xaaad885f4fb3a08cb5dad33be3031d6886b5ad62" as `0x${string}`;

export const CDR_OWNER_CONDITION = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const STORY_AENEID_CHAIN_ID = 1315;

export const STORY_AENEID_RPC = "https://aeneid.storyrpc.io";

export const STORY_EXPLORER = "https://aeneid.storyscan.io";

export const DARKPOOL_ABI = [
  {
    name: "list",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "reservePrice", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256" }],
  },
  {
    name: "placeBid",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "bidVaultId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "revealBid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "settle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "seller", type: "address" },
          { name: "vaultId", type: "bytes32" },
          { name: "metadataURI", type: "string" },
          { name: "reservePrice", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "settled", type: "bool" },
          { name: "winner", type: "address" },
          { name: "winningBid", type: "uint256" },
          { name: "licenseTokenId", type: "uint256" },
          { name: "royaltyBps", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "nextListingId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getBidCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;