const { HDNodeWallet } = require('ethers');

const mnemonic = 'move fly rhythm relief vendor master indoor oxygen case pledge rotate exhibit';

try {
  const wallet = HDNodeWallet.fromPhrase(mnemonic, '', "m/44'/60'/0'/0/0");
  console.log('✅ ETH Address:', wallet.address);
} catch (e) {
  console.error(' Error:', e.message);
}
