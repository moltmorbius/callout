/**
 * Cryptographic utilities for signature verification and public key recovery.
 *
 * This module provides functions for:
 * - Parsing and verifying signed messages in the MESSAGE/SIGNATURE format
 * - Recovering Ethereum addresses from signatures (EIP-191)
 * - Converting between public keys and addresses
 * - Searching for and recovering public keys from on-chain transactions
 *
 * @module crypto
 */

export {
  parseSignedMessage,
  recoverAddressFromSignedMessage,
  type ParsedSignedMessage,
} from './signatureRecovery.js'

export {
  publicKeyToAddress,
  fetchAndRecoverPublicKey,
  searchTransactionAcrossChains,
  recoverPublicKeyFromAddress,
  type RecoveredPublicKey,
} from './publicKeyRecovery.js'
