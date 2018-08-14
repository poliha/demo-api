const config = require('config');
const express = require('express');
const bodyparser = require('body-parser');
const Utility = require('./utility');
const Tasks = require('./tasks');
const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", config.get('allowedOrigins'));
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  next();
});

app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(bodyparser.json());



// ROUTES
app.get('/keypair', [Utility.logRequestInfo], function (req, res) {

  Tasks.generateKeypair(req, res)
    .then(function (resp) {
      return res.status(200).send(Utility.buildResponse(true, resp.data, resp.message));
    })
    .catch(function (error) {
      console.log("error: ", error);
      return res.status(400).send(Utility.buildResponse(false, null, error));
    });

});

app.post('/create-account', [Utility.logRequestInfo], function (req, res) {

  Tasks.createAccount(req, res)
    .then(function (resp) {
      return res.status(200).send(Utility.buildResponse(true, resp.data, resp.message));
    })
    .catch(function (error) {
      console.log("error: ", error);
      return res.status(400).send(Utility.buildResponse(false, null, error));
    });

});

app.get('/trustlines', [Utility.logRequestInfo], function (req, res) {

  Tasks.trustlines(req, res)
    .then(function (resp) {
      return res.status(200).send(Utility.buildResponse(true, resp.data, resp.message));
    })
    .catch(function (error) {
      console.log("error: ", error);
      return res.status(400).send(Utility.buildResponse(false, null, error));
    });

});


app.get('/offers', [Utility.logRequestInfo], function (req, res) {

  Tasks.offers(req, res)
    .then(function (resp) {
      return res.status(200).send(Utility.buildResponse(true, resp.data, resp.message));
    })
    .catch(function (error) {
      console.log("error: ", error);
      return res.status(400).send(Utility.buildResponse(false, null, error));
    });

});

app.get('/path-payment', [Utility.logRequestInfo], function (req, res) {

  Tasks.pathPayment(req, res)
    .then(function (resp) {
      return res.status(200).send(Utility.buildResponse(true, resp.data, resp.message));
    })
    .catch(function (error) {
      console.log("error: ", error);
      return res.status(400).send(Utility.buildResponse(false, null, error));
    });

});



const server = app.listen(config.get('port'), () => {
  console.log(`${config.get('appName')} Server listening on port ${server.address().port}`);
});
