
var express = require('express');
const http = require('http')
var app = express();
var builder = require('botbuilder');
var logger = require('morgan')
var bodyParser = require('body-parser');
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.WW_ENCRYPT || 'd6F3Efeq';
const fs = require('fs')
const path = require('path')
var inMemoryStorage = new builder.MemoryBotStorage();

const port = normalizePort(process.env.PORT || '80');



app.use(bodyParser.json({ type: 'application/json', limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
var pipeConsole = new Console(
    fs.createWriteStream('./SkypeStOut.log'),
    fs.createWriteStream('./SkypeStErr.log')
);
console = pipeConsole;
// setup the logger
app.use(logger('combined', {stream: accessLogStream}))

app.get('/', (req, res, next) => {
    res.send('hello webward');
})
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
app.post('/api/messages', (req, res) => {
    console.log(req.body);
    (connector.listen())(req, res);
});

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
bot.on('error', (data) => {
    console.log("Bot Error")
    console.log(data)
})

function sendProactiveMessage(address, message) {
    var msg = new builder.Message().address(address);
    msg.text(message);
    msg.textLocale('es-ES');
    bot.send(msg);
}

bot.dialog('adhocDialog', function (session, args) {
    var savedAddress = session.message.address;

    // (Save this information somewhere that it can be accessed later, such as in a database, or session.userData)
    session.userData.savedAddress = savedAddress;
    var message = `Hello user, good to meet you! 
    I now know your address and can send you notifications in the future.
    Your encrypted address is:
    ${encrypt(JSON.stringify(savedAddress))}`;

    session.send(message);
}).triggerAction({
    matches: /^webward$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack 
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
})
bot.dialog('/', function (session, args) {
    //Muted bot
    session.send("You said: %s", session.message.text);
})

//Local sending messages
app.post('/webward/messages', (req, res) => {
    console.log(req.body)
    console.log(process.env.MicrosoftAppId)
    console.log(process.env.MicrosoftAppPassword)
    if (req.body
        && typeof req.body.address === 'string'
        && typeof req.body.message === 'string') {
        try {
            sendProactiveMessage(obtainAddress(req.body.address), req.body.message)
            res.send({ "status": "ok" })
        } catch (err) {
            res.status(500).send({ "status": "error", "error": err })
        }

    } else {
        res.status(500).send({ "error": "No body" })
    }
});
function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}
function obtainAddress(addEncrypted) {
    var addDecrypted;
    try {
        addDecrypted = decrypt(addEncrypted);
    } catch (err) {
        console.log("error decrypt")
        onsole.log(err)
        throw err;
    }
    try {
        var addParsed = JSON.parse(addDecrypted);
        return addParsed;
    } catch (err) {
        console.log("error parse")
        console.log(err)
        throw err;
    }

}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
});
app.set('port', port);
var server = http.createServer(app);
server.listen(port);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}