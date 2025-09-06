import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  async encrypt(publicKeyBase64: string, text: string): Promise<string> {
    try {
      console.log('Starting encryption process...');
      console.log('Public key (base64):', publicKeyBase64);

      // Convert base64 to binary
      const binaryDer = window.atob(publicKeyBase64);
      const keyBytes = new Uint8Array(binaryDer.length);
      for (let i = 0; i < binaryDer.length; i++) {
        keyBytes[i] = binaryDer.charCodeAt(i);
      }
      console.log('Public key bytes:', keyBytes);

      // Import public key
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        keyBytes,
        {
          name: 'RSA-OAEP',
          hash: { name: 'SHA-256' }
        },
        false,
        ['encrypt']
      );
      console.log('Public key imported successfully');

      // Prepare data for encryption
      const textBytes = new TextEncoder().encode(text);
      console.log('Text bytes:', textBytes);

      // Encrypt data
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        textBytes
      );
      console.log('Encryption successful');

      // Convert to base64
      const encryptedBase64 = window.btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      console.log('Encrypted data (base64):', encryptedBase64);

      return encryptedBase64;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
}
