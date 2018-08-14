const StellarSdk = require('stellar-sdk');

let self = {

  validateKey: function(publicKey) {
    return StellarSdk.StrKey.isValidEd25519PublicKey(publicKey);
  },

  buildResponse: function (status, data, message) {
    return {
      "success": status,
      "content": {
        "data": data,
        "message": message
      }
    };
  },

  logRequestInfo: function (req, res, next) {
    console.log("=======BEGIN==========");
    console.log("Endpoint: ", req.originalUrl, "IP: ", req.ip);
    // console.log("Request header: ", req.headers);
    console.log("Request Body: ", req.body);
    console.log("Request Query: ", req.query);
    console.log("Request Params: ", req.params);
    console.log("========END=========");
    return next();

  },

};

module.exports = self;