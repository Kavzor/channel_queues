var Maja = require('./message_receiver');

let maja = new Maja('$', 'queue');
maja.botReady(maja.setupLogger, maja.resetChannel, maja.updateQueueList.bind(maja))
maja.on("message", maja.receiveMessage.bind(maja));
maja.on("voiceStateUpdate", maja.queryQueue.bind(maja));

(function env(bot, system, args) {
    if(system.env.npm_package_config_devMode) {
        bot.login("");
    } else {
        bot.login("");
    }
    
    system.stdin.resume();//so the program will not close instantly
    
    function destroyBot(options, code) {
        bot.logInfo(`Type ${options.exit} with code ${code}`)
        if (options.exit) {
            bot.logInfo(`Shutting down bot ${bot.name}`)
            bot.resetChannel();
            bot.destroy();
            system.exit();
        }
    }
    
    //do something when app is closing
    system.on('exit', destroyBot.bind(null,{cleanup:true}));
    
    //catches ctrl+c event
    system.on('SIGINT', destroyBot.bind(null, {exit:true}));
    
    // catches "kill pid" (for example: nodemon restart)
    system.on('SIGUSR1', destroyBot.bind(null, {exit:true}));
    system.on('SIGUSR2', destroyBot.bind(null, {exit:true}));
    
    //catches uncaught exceptions
    system.on('uncaughtException', destroyBot.bind(null, {exit:true}));
})(maja, process, process.argv);
