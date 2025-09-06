import { Injectable } from '@angular/core';

// Declare JSEncrypt as any type since we don't have type definitions
declare const JSEncrypt: any;

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  async encrypt(publicKeyBase64: string, text: string): Promise<string> {
    try {
      console.log('Starting encryption process...');
      
      // Clean up public key
      const cleanPublicKey = publicKeyBase64.replace(/[\n\r\s]/g, '');
      console.log('Cleaned public key:', cleanPublicKey);

      // Format public key with header and footer
      const formattedKey = 
        '-----BEGIN PUBLIC KEY-----\n' +
        cleanPublicKey +
        '\n-----END PUBLIC KEY-----';

      // Use JSEncrypt for RSA encryption
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(formattedKey);
      console.log('Public key set:', formattedKey);

      // Encrypt the data
      console.log('Text to encrypt:', text);
      const encrypted = encrypt.encrypt(text);
      if (!encrypted) {
        throw new Error('Encryption failed');
      }

      console.log('Encryption successful');
      console.log('Encrypted data:', encrypted);
      console.log('Encrypted length:', encrypted.length);

      return encrypted;
    } catch (err: any) {
      console.error('Encryption error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error('Failed to encrypt data: ' + errorMessage);
    }
  }
}
