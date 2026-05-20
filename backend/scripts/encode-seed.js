const crypto = require('crypto');

const mnemonic = 'move fly rhythm relief vendor master indoor oxygen case pledge rotate exhibit';
const encoded = Buffer.from(mnemonic).toString('base64');
console.log('Base64 encoded MNEMONIC_SEED:');
console.log(encoded);
console.log('\nAdd this to Railway as MNEMONIC_SEED_B64');
