const config = require('config');
const StellarSdk = require('stellar-sdk');
const Utility = require('./utility');
let messages = [];
let returnObject = {
  data: {},
  message: messages
};
const ISSUER = config.get("issuer");
const SENDER = config.get("sender");
const RECEIVER = config.get("receiver");
const ASSETCODE = config.get("assetCode");

// Initialisae the horizon Server
StellarSdk.Config.setAllowHttp(true);
StellarSdk.Network.useTestNetwork();
let horizonServer = new StellarSdk.Server(config.get("horizonUrl"));

function generateKeypair(req, res) {
  messages = [];
  
  try {
  const pair = StellarSdk.Keypair.random();
  returnObject.data = {
    publicKey: pair.publicKey(),
    privateKey: pair.secret()
  };
  messages.push('Keypair generated');
  returnObject.message = messages;
  
  return Promise.resolve(returnObject);
  
  } catch (error) {
    console.log("error: ", error);
    messages.push('An error occured. Check logs');
    return Promise.reject(messages);
  }
}

async function createAccount(req, res) {
  messages = [];

  try {

    if (!Utility.validateKey(req.body.publicKey)) {
      messages.push("Invalid Public key");
      throw new Error("Invalid Public key");
    }

    // Get issuer account detail
    const issuerDetail = await horizonServer.loadAccount(ISSUER.publicKey);
    console.log('issuerDetails: ', issuerDetail);

    // build a transaction
    let transaction = new StellarSdk.TransactionBuilder(issuerDetail);

    // add a create account operation
    let operationObj = {
      destination: req.body.publicKey,
      startingBalance: String(config.get("startingBalance"))
    };
    transaction.addOperation(StellarSdk.Operation.createAccount(operationObj));

    // build and sign transaction
    let builtTx = transaction.build();
    builtTx.sign(StellarSdk.Keypair.fromSecret(ISSUER.privateKey));
    
    // submit transaction to horizonServer
    let result = await horizonServer.submitTransaction(builtTx);
    if (!result) {
      messages.push("Horizon Error");
      throw new Error("horizon Error");
    } else {
      messages.push('Transaction submitted successfully');
      returnObject.data = result;
      returnObject.message = messages;
      console.log('Return Obj: ', returnObject);
      return Promise.resolve(returnObject);
    }

  } catch (error) {
    console.log("error: ", error);
    messages.push('An error occured. Check logs');
    return Promise.reject(messages);
  }

}

async function trustlines(req, res) {
  // create trustline from receiver to issuer
  messages = [];

  try {

    if (!Utility.validateKey(RECEIVER.publicKey)) {
      messages.push("Invalid Public key");
      throw new Error("Invalid Public key");
    }

    // Get receiver account detail
    const receiverDetail = await horizonServer.loadAccount(RECEIVER.publicKey);
    console.log('rcvrDetails: ', receiverDetail);

    // build a transaction
    let transaction = new StellarSdk.TransactionBuilder(receiverDetail);

    // add a change trust operation
    let customAsset = new StellarSdk.Asset(ASSETCODE, ISSUER.publicKey);
    let operationObj = {
      asset: customAsset
    };

    transaction.addOperation(StellarSdk.Operation.changeTrust(operationObj));

    // build and sign transaction
    let builtTx = transaction.build();
    builtTx.sign(StellarSdk.Keypair.fromSecret(RECEIVER.privateKey));

    // submit transaction to horizonServer
    let result = await horizonServer.submitTransaction(builtTx);
    if (!result) {
      messages.push("Horizon Error");
      throw new Error("horizon Error");
    } else {
      messages.push('Transaction submitted successfully');
      returnObject.data = result;
      returnObject.message = messages;
      console.log('Return Obj: ', returnObject);
      return Promise.resolve(returnObject);
    }

  } catch (error) {
    console.log("error: ", error);
    messages.push('An error occured. Check logs');
    return Promise.reject(messages);
  }
}

async function offers(req, res) {
  // create a manage offer operation to sell RWF for XLM
  messages = [];

  try {

    if (!Utility.validateKey(ISSUER.publicKey)) {
      messages.push("Invalid Public key");
      throw new Error("Invalid Public key");
    }

    // Get issuer account detail
    const issuerDetail = await horizonServer.loadAccount(ISSUER.publicKey);
    console.log('issuerDetails: ', issuerDetail);

    // build a transaction
    let transaction = new StellarSdk.TransactionBuilder(issuerDetail);

    // add a manage operation
    let customAsset = new StellarSdk.Asset(ASSETCODE, ISSUER.publicKey);
    let operationObj = {
      selling: customAsset,
      buying: StellarSdk.Asset.native(),
      amount: String(5000000),
      price: 0.002, //500RWF = 1XLM
      offerId: 0
    };

    transaction.addOperation(StellarSdk.Operation.manageOffer(operationObj));

    // build and sign transaction
    let builtTx = transaction.build();
    builtTx.sign(StellarSdk.Keypair.fromSecret(ISSUER.privateKey));

    // submit transaction to horizonServer
    let result = await horizonServer.submitTransaction(builtTx);
    if (!result) {
      messages.push("Horizon Error");
      throw new Error("horizon Error");
    } else {
      messages.push('Transaction submitted successfully');
      returnObject.data = result;
      returnObject.message = messages;
      console.log('Return Obj: ', returnObject);
      return Promise.resolve(returnObject);
    }

  } catch (error) {
    console.log("error: ", error);
    messages.push('An error occured. Check logs');
    return Promise.reject(messages);
  }
}

async function pathPayment(req, res) {
// two steps in making path payment.
// - find paths
// - make path payment operation
  messages = [];

  try {

    if (!Utility.validateKey(SENDER.publicKey)) {
      messages.push("Invalid Public key");
      throw new Error("Invalid Public key");
    }
    let customAsset = new StellarSdk.Asset(ASSETCODE, ISSUER.publicKey);
    let destinationAmount = config.get("destinationAmount");
    
    // find paths
    const paymentPaths = await horizonServer.paths(SENDER.publicKey, RECEIVER.publicKey, customAsset, destinationAmount).call();
    console.log('paths: ', paymentPaths);

    if (!paymentPaths) {
      messages.push("No payment paths");
      throw new Error("horizon Error");
    }

    // make path payment
    // Get sender account detail
    const senderDetail = await horizonServer.loadAccount(SENDER.publicKey);
    console.log('senderDetails: ', senderDetail);

    // build a transaction
    let transaction = new StellarSdk.TransactionBuilder(senderDetail);

    // add a path payment operation        
    let operationObj = {
      sendAsset: StellarSdk.Asset.native(),
      sendMax: paymentPaths.records[0].source_amount,
      destination: RECEIVER.publicKey,
      destAsset: customAsset,
      destAmount: destinationAmount,
      path: paymentPaths.records[0].paths
    };

    transaction.addOperation(StellarSdk.Operation.pathPayment(operationObj));

    // build and sign transaction
    let builtTx = transaction.build();
    builtTx.sign(StellarSdk.Keypair.fromSecret(SENDER.privateKey));

    // submit transaction to horizonServer
    let result = await horizonServer.submitTransaction(builtTx);
    if (!result) {
      messages.push("Horizon Error");
      throw new Error("horizon Error");
    } else {
      messages.push('Transaction submitted successfully');
      returnObject.data = {
          pathUsed: paymentPaths.records[0], 
          txResult: result
      };
      returnObject.message = messages;
      console.log('Return Obj: ', returnObject);
      return Promise.resolve(returnObject);
    }

  } catch (error) {
    console.log("error: ", error.response.data);
    messages.push('An error occured. Check logs');
    return Promise.reject(messages);
  }

}



module.exports = {
  generateKeypair: generateKeypair,
  createAccount: createAccount,
  trustlines: trustlines,
  offers: offers,
  pathPayment: pathPayment
}