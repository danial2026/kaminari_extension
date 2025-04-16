/**
 * encryption.js - Encryption utilities for secure sharing
 */

import { showSnackbar } from "./utils.js";

/**
 * Compresses a string using LZString compression
 * @param {string} data - String to compress
 * @returns {string} - Compressed string
 */
function compressData(data) {
  // Simple polyfill for LZString
  if (typeof LZString === "undefined") {
    // This is a simplified version of LZString for compression
    return btoa(data);
  }
  return LZString.compressToBase64(data);
}

/**
 * Decompresses a string using LZString decompression
 * @param {string} compressedData - Compressed string
 * @returns {string} - Decompressed string
 */
function decompressData(compressedData) {
  // Simple polyfill for LZString
  if (typeof LZString === "undefined") {
    // This is a simplified version of LZString for decompression
    return atob(compressedData);
  }
  return LZString.decompressFromBase64(compressedData);
}

/**
 * Converts a string to Uint8Array
 * @param {string} str - String to convert
 * @returns {Uint8Array}
 */
function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Converts a Uint8Array to string
 * @param {Uint8Array} array - Array to convert
 * @returns {string}
 */
function uint8ArrayToString(array) {
  const decoder = new TextDecoder();
  return decoder.decode(array);
}

/**
 * Converts a Uint8Array to Base64Url string (URL-safe base64)
 * @param {Uint8Array} array - Array to convert
 * @returns {string} - Base64Url encoded string
 */
function uint8ArrayToBase64Url(array) {
  // First convert to regular base64
  let binaryString = "";
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binaryString += String.fromCharCode(array[i]);
  }
  const base64 = btoa(binaryString);

  // Then make it URL-safe by replacing + with - and / with _
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts a Base64Url string to Uint8Array
 * @param {string} base64url - Base64Url encoded string
 * @returns {Uint8Array}
 */
function base64UrlToUint8Array(base64url) {
  // Convert URL-safe base64 to regular base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert to Uint8Array
  const len = binaryString.length;
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = binaryString.charCodeAt(i);
  }

  return array;
}

/**
 * Derives a cryptographic key from a password
 * @param {string} password - User-provided password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import as raw key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive actual key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data with a password
 * @param {string} data - Data to encrypt
 * @param {string} password - Password to encrypt with
 * @returns {Promise<{v: number, s: string, i: string, d: string}>} - Encrypted payload
 */
export async function encrypt(data, password) {
  try {
    // Generate random salt and iv
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Compress the data before encryption
    const compressedData = compressData(data);
    const dataBuffer = stringToUint8Array(compressedData);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Convert to Uint8Array
    const encryptedArray = new Uint8Array(encryptedBuffer);

    // Package everything together
    return {
      v: 1, // Version
      s: uint8ArrayToBase64Url(salt),
      i: uint8ArrayToBase64Url(iv),
      d: uint8ArrayToBase64Url(encryptedArray),
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts data with a password
 * @param {string} encryptedData - JSON string of encrypted payload
 * @param {string} password - Password to decrypt with
 * @returns {string} - Decrypted data
 */
export async function decrypt(encryptedData, password) {
  try {
    // Parse the encrypted payload
    const payload = JSON.parse(encryptedData);

    // Check version
    if (payload.v !== 1) {
      throw new Error(`Unsupported encryption version: ${payload.v}`);
    }

    // Extract components
    const salt = base64UrlToUint8Array(payload.s);
    const iv = base64UrlToUint8Array(payload.i);
    const encryptedArray = base64UrlToUint8Array(payload.d);

    // Derive key from password and salt
    const key = await deriveKey(password, salt);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedArray
    );

    // Convert to string and decompress
    const compressedData = uint8ArrayToString(new Uint8Array(decryptedBuffer));
    return decompressData(compressedData);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}
