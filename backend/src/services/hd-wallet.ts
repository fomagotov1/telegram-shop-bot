import { HDNodeWallet, keccak256, Wallet } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bs58check from 'bs58check';
import { ECPairFactory } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';

const ECPair = ECPairFactory(tinysecp);
bitcoin.initEccLib(tinysecp);

function getMnemonic(): string | null {
  if (process.env.MNEMONIC_SEED_B64) {
    try {
      return Buffer.from(process.env.MNEMONIC_SEED_B64, 'base64').toString('utf-8').trim();
    } catch (e) {
      console.error('Failed to decode MNEMONIC_SEED_B64:', e);
      return null;
    }
  }
  return process.env.MNEMONIC_SEED?.trim() || null;
}

const MNEMONIC = getMnemonic();

if (!MNEMONIC) {
  console.warn('⚠️ MNEMONIC_SEED not set. HD Wallet generation will fail.');
} else {
  const wordCount = MNEMONIC.split(' ').length;
  console.log(`✅ HD Wallet initialized with ${wordCount}-word seed phrase`);
}

const BTC_PATH_PREFIX = "m/84'/0'/0'/0/";
const ETH_PATH_PREFIX = "m/44'/60'/0'/0/";
const TRON_PATH_PREFIX = "m/44'/195'/0'/0/";

export interface DepositAddress {
  address: string;
  path: string;
  index: number;
}

export function generateBtcAddress(index: number): DepositAddress {
  if (!MNEMONIC) throw new Error('MNEMONIC_SEED not configured');

  const seed = bip39.mnemonicToSeedSync(MNEMONIC);
  const root = bip32.BIP32Factory(tinysecp).fromSeed(seed);

  const path = `${BTC_PATH_PREFIX}${index}`;
  const child = root.derivePath(path);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
    network: bitcoin.networks.bitcoin,
  });

  if (!address) throw new Error('Failed to generate BTC address');

  return { address, path, index };
}

export function generateEthAddress(index: number): DepositAddress {
  if (!MNEMONIC) throw new Error('MNEMONIC_SEED not configured');

  const path = `${ETH_PATH_PREFIX}${index}`;
  const wallet = HDNodeWallet.fromPhrase(MNEMONIC, '', path);

  return { address: wallet.address, path, index };
}

export function generateTronAddress(index: number): DepositAddress {
  if (!MNEMONIC) throw new Error('MNEMONIC_SEED not configured');

  const path = `${TRON_PATH_PREFIX}${index}`;
  const wallet = HDNodeWallet.fromPhrase(MNEMONIC, '', path);

  const privateKey = wallet.privateKey;
  const tronAddress = privateKeyToTronAddress(privateKey);

  return { address: tronAddress, path, index };
}

export function generateDepositAddress(
  currency: string,
  index: number
): DepositAddress {
  switch (currency) {
    case 'BTC':
      return generateBtcAddress(index);
    case 'ETH':
    case 'USDT_ERC20':
      return generateEthAddress(index);
    case 'USDT_TRC20':
      return generateTronAddress(index);
    default:
      throw new Error(`Unsupported currency for HD wallet: ${currency}`);
  }
}

function privateKeyToTronAddress(privateKey: string): string {
  const pk = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  const wallet = new Wallet('0x' + pk);
  const publicKey = (wallet as any).signingKey?.compressedPublicKey || (wallet as any).signingKey?.publicKey;
  const pubKeyHex = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
  const pubKeyBytes = Buffer.from(pubKeyHex, 'hex');

  const hash = keccak256(pubKeyBytes).slice(2);
  const addressBytes = Buffer.from(hash.slice(-40), 'hex');

  const tronAddressBytes = Buffer.concat([Buffer.from('41', 'hex'), addressBytes]);

  return bs58check.default.encode(tronAddressBytes);
}

export function getNextIndex(
  db: any,
  currency: string
): number {
  const result = db.prepare(
    'SELECT MAX(address_index) as max_index FROM orders WHERE crypto_currency = ?'
  ).get(currency);

  return (result?.max_index ?? -1) + 1;
}
