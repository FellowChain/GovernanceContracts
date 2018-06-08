
var secretData = require('./secrets.js');

require('dotenv').config();
require('babel-register');
require('babel-polyfill');

require('babel-node-modules')([
  'zeppelin-solidity'
])

var HDWalletProvider = require("truffle-hdwallet-provider");


var infuraRinkebyUrl = secretData.INFURA_RINKEBY_URL;
var sokolUrl = secretData.SOKOL_NETWORK_URL;
var mnemonic = secretData.SECRET_MNEMONIC;
var providerRinkeby = new HDWalletProvider(mnemonic, infuraRinkebyUrl);
var providerMain = new HDWalletProvider(mnemonic, infuraMainUrl);
var providerSokol = new HDWalletProvider(mnemonic, sokolUrl);

console.log("Public key = "+provider.address);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
   development: {
     host: 'localhost',
     port: 8545,
     gas: 5000000,
     network_id: '*', // eslint-disable-line camelcase
   },
    rinkeby: {
      provider: providerRinkeby,
      network_id: 4, // eslint-disable-line camelcase
      gasPrice: "50000000000",
      gas: 5000000,
    },
    sokol: {
      provider: providerSokol,
      network_id: 3, // eslint-disable-line camelcase
      gasPrice: "50000000000",
      gas: 8000000,
    },
    main: {
      provider: providerMain,
      network_id: 1, // eslint-disable-line camelcase
      gasPrice: "1000000000",
      gas: 5000000,
    }
 }
};
