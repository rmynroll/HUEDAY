const CIPHER_KEY = 0x5a7e;

/**
 * Encrypts a time capsule note using XOR character encoding + Base64/Hex encoding.
 */
export function encryptCapsuleNote(text: string): string {
  if (!text) return '';
  try {
    const charCodes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      charCodes.push(text.charCodeAt(i) ^ CIPHER_KEY);
    }
    const hexString = charCodes.map((c) => c.toString(16).padStart(4, '0')).join('');
    return `enc_v1_${hexString}`;
  } catch {
    return text;
  }
}

/**
 * Decrypts a time capsule note.
 */
export function decryptCapsuleNote(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc_v1_')) {
    return cipherText; // Fallback if unencrypted
  }

  try {
    const hexString = cipherText.replace('enc_v1_', '');
    const charCodes: number[] = [];
    for (let i = 0; i < hexString.length; i += 4) {
      const hexChunk = hexString.substring(i, i + 4);
      const code = parseInt(hexChunk, 16) ^ CIPHER_KEY;
      charCodes.push(code);
    }
    return String.fromCharCode(...charCodes);
  } catch {
    return cipherText;
  }
}
