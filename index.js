/*!
 * PhnBot
 * A Messenger bot build for `Den of Phoenix` glorious page.
 *
 * Author: MizoPro (C) 2018
 * License: The MIT License <https://github.com/mizopro/phnbot/blob/master/LICENSE>
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables and add them to `process.env`
dotenv.load();

/**
 * @const app Express's app instance.
 */
const app = express().use(bodyParser.json());

/**
 * @const PORT if no port was present in the enironment, fallbacks to `1337`
 */
const PORT = process.env.PORT || 1337;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

  const body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach((entry) => {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  //let VERIFY_TOKEN = "TOKEN"

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// App optional index page
app.get('/', (req, res) => {
    res.sendFile('index.html');
});


// App listening
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
