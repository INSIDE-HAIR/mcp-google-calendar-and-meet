// Encryption utilities for storing sensitive data
import crypto from 'crypto';

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET environment variable is required');
}

// Ensure key is 32 bytes for AES-256
const KEY = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV prepended
 */
export function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted text with IV prepended
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
export function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate random API key
 * @param {number} length - Length of the key (default: 32)
 * @returns {string} - Random API key
 */
export function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure random token
 * @param {number} length - Length of the token (default: 16)
 * @returns {string} - Random token
 */
export function generateSecureToken(length = 16) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Validate encryption key strength
 * @returns {boolean} - True if key is strong enough
 */
export function validateEncryptionKey() {
  return ENCRYPTION_KEY && ENCRYPTION_KEY.length >= 32;
}

// Test encryption/decryption on startup
if (process.env.NODE_ENV !== 'production') {
  try {
    const testData = 'test-encryption-data';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== testData) {
      throw new Error('Encryption test failed');
    }
    
    console.log('✅ Encryption system test passed');
  } catch (error) {
    console.error('❌ Encryption system test failed:', error);
  }
}