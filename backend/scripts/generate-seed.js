const bip39 = require('bip39');

const mnemonic = bip39.generateMnemonic();
console.log('🔑 Your HD Wallet Seed Phrase:');
console.log(mnemonic);
console.log('\n️  SAVE THIS SECURELY! This is needed to access all funds.');
console.log('Add it to Railway as MNEMONIC_SEED environment variable.');
