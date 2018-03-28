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
const request = require("request");
const dotenv = require("dotenv");

// Load environment variables and add them to `process.env`
dotenv.load();


/**
 * @const {Express} app
 */
const app = express().use(bodyParser.json());

/**
 * @const {String} PAGE_ACCESS_TOKEN
 */
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

/**
 * @const {Number} PORT
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

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
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

    /**
     * @const {String} VERIFY_TOKEN
     */
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    } else {
        // Responds with '403 Forbidden' when no token were supplied
        res.sendStatus(403);
    }
});

// App optional index page
app.get('/', (req, res) => {
    res.sendFile('index.html');
});


// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {

        // Create the payload for a basic text message
        response = {
            "text": `"${received_message.text}" ka?`
        }
    } else if (received_message.attachments) {

        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [{
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

      // Get the payload for the postback
      let payload = received_postback.payload;

      // Set the response based on the postback payload
      if (payload === 'yes') {
        response = { "text": "Yay!" }
      } else if (payload === 'no') {
        response = { "text": "Goumen (._.)" }
      }
      // Send the message to acknowledge the postback
      callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {
            "access_token": PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('Message sent!');
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

// App listening
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
