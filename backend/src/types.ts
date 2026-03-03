// Shared types used across services

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;      // raw hex, may be '0x0' when loaded from DB
  valueEth: number;
  valueUsd: number;
  blockNumber: number;
  timestamp: number;  // Unix ms
}
