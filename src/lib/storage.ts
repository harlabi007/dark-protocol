// src/lib/storage.ts
// Stores bid vault IDs and listing vault IDs in localStorage

export type SavedBid = {
  listingId: string;
  bidVaultId: string;
  depositAmount: string;
  timestamp: number;
};

export type SavedListing = {
  listingId: string;
  vaultId: string;
  title: string;
  timestamp: number;
};

export function saveBid(bid: SavedBid) {
  const existing = getBids();
  existing.push(bid);
  localStorage.setItem("darkpool_bids", JSON.stringify(existing));
}

export function getBids(): SavedBid[] {
  try {
    return JSON.parse(localStorage.getItem("darkpool_bids") || "[]");
  } catch {
    return [];
  }
}

export function saveListing(listing: SavedListing) {
  const existing = getListings();
  existing.push(listing);
  localStorage.setItem("darkpool_listings", JSON.stringify(existing));
}

export function getListings(): SavedListing[] {
  try {
    return JSON.parse(localStorage.getItem("darkpool_listings") || "[]");
  } catch {
    return [];
  }
}

export function clearBids() {
  localStorage.removeItem("darkpool_bids");
}