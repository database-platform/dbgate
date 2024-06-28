const crypto = require('crypto');

const KEY_ALGORITHM = 'aes-128-ecb';

function generateAESKey() {
  return crypto.randomBytes(16).toString('base64');
}

function encrypt(data, key) {
  const cipher = crypto.createCipheriv(KEY_ALGORITHM, Buffer.from(key, 'base64'), null);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(data, key) {
  const decipher = crypto.createDecipheriv(KEY_ALGORITHM, Buffer.from(key, 'base64'), null);
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function test(key) {
  try {
    //const key = generateAESKey();
    const originalText = 'Sun_123456!';
    // const encryptedText = encrypt(originalText, key);
    const encryptedText = 'DR0kKY4inoKvDP91jrL+Gw==';
    const decryptedText = decrypt(encryptedText, key);

    console.log('Original Text: ' + originalText);
    console.log('Encrypted Text: ' + encryptedText);
    console.log('Decrypted Text: ' + decryptedText);
  } catch (err) {
    console.error('Error: ', err);
  }
}

module.exports = {
  encrypt,
  decrypt,
  test,
};
