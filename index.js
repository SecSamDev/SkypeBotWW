
var restify = require('restify');
var builder = require('botbuilder');
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.WW_ENCRYPT || 'd6F3Efeq';
var inMemoryStorage = new builder.MemoryBotStorage();
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.bot_port || process.env.BOT_PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
server.get('/',(req,res,next)=>{
    res.send('hello webward');
    next();
})
// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);

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
    //session.send("You said: %s", session.message.text);
})
server.use(restify.plugins.bodyParser())
server.use(restify.plugins.jsonBodyParser())
//Local sending messages
server.post('/webward/messages', (req, res) => {
    if (req.body
        && typeof req.body.address === 'string'
        && typeof req.body.message === 'string') {
        try {
            sendProactiveMessage(obtainAddress(req.body.address), req.body.message)
            res.send({ "status": "ok" })
        } catch (err) {
            res.send({ "status": "error" })
        }

    } else {
        res.send({ "error": "No body" })
    }
});
function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}
function obtainAddress(addEncrypted) {
    try{
        var addDecrypted = decrypt(addEncrypted);
        var addParsed = JSON.parse(addDecrypted);
        if (typeof addParsed.id === 'string'
            && typeof addParsed.id === 'string'
            && addParsed.user
                && typeof addParsed.user.id === 'string'
                && typeof addParsed.user.name === 'string'
            && addParsed.conversation 
                && typeof addParsed.user.id === 'string'
            && addParsed.bot
                && typeof addParsed.bot.id === 'string'
                && typeof addParsed.bot.name === 'string'
                && typeof addParsed.bot.role === 'string'
            && typeof addParsed.serviceUrl === 'string'
        ) {
            return addParsed;
        }else{
            throw new Error("Not valid")
        }
    }catch(err){
        throw new Error("Somthing failed")
    }
    
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}