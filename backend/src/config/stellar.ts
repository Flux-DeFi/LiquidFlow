import dotenv from 'dotenv';

dotenv.config();

export interface StellarConfig {
  network: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
}

export const stellarConfig: StellarConfig = {
  network: process.env.STELLAR_NETWORK || 'testnet',
  horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
};

export default stellarConfig;
