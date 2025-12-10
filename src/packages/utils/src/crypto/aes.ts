import CryptoJS from 'crypto-js';

export function encryptAes(text: string, keyBuf: string) {
  const iv = CryptoJS.lib.WordArray.random(32);
  const keyBytes = CryptoJS.enc.Utf8.parse(keyBuf);
  const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 8)); // 32 bytes = 8 words

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return iv.toString(CryptoJS.enc.Base64) + ':' + encrypted.toString();
}

export function decryptAes(cipherText: string, keyBuf: string) {
  const [ivBase64, encrypted] = cipherText.split(':');
  const keyBytes = CryptoJS.enc.Utf8.parse(keyBuf);
  const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 8)); // 32 bytes = 8 words
  const iv = CryptoJS.enc.Base64.parse(ivBase64);

  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
