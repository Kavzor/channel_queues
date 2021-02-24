const Discord = require('discord.js');
const logger = require('winston');
const stringUtil = require('./stringUtil');

module.exports = class ChannelBot extends Discord.Client {
    constructor(name, channel) {
        super();
        this.name = name
        this.channel = channel
        this.FLAGS = {NO_PERMISSION: 0, VOICE_FULL: 1, NOT_JOINABLE: 2, SUCCESSFULLY_JOINED: 3, NOT_FOUND: 4}
    }
    botReady(...callbacks) {
        callbacks.forEach(callback => {
            this.once("ready", callback.bind(this));
        });
    }
    setupLogger(level = 'debug') {
        logger.remove(logger.transports.Console);
        logger.add(new logger.transports.Console, {
            colorize: true
        });
        logger.level = level;
        logger.info('Connected');
        logger.info(`Logged in as: ${this.user.username}`);
        logger.info(`ID: ${this.user.id}`);
    }
    resetChannel() {
        let channel = this.channels.cache.find(channel => channel.name === this.channel);
        channel.bulkDelete(100);
        return channel;
    }
    logInfo(message) {
        logger.info(message);
    }
    logError(message) {
        logger.error(message);
    }
    findChannelMatch(query) {
        let match = {channel: undefined, value: -1}
        this.channels.cache.forEach(channel => {
            if(channel.type != 'voice') {
                return false;
            }
            let distance = stringUtil.levDist(channel.name, query);
            if(!match.channel) {
                match.channel = channel
                match.value = distance;
            } else if (match.value > distance) {
                match.channel = channel;
                match.value = distance;
            }
        });
        return match.value < 6 && match.channel;
    }
    sendReply(text, message, durationBot, durationPlayer) {
        message.channel.send(text).then(msg => {
            msg.delete({timeout: durationBot});
            if(durationPlayer) {
                message.delete({timeout: durationPlayer});
            }
        }).catch(err => this.logInfo(err));
    }
    attemptVoiceJoin(member, channel) {
        if(!channel) {
            return this.FLAGS.NOT_FOUND
        } else if(!channel.joinable || channel.full) {
            return this.FLAGS.VOICE_FULL;
        } else if(!this.isJoinableBy(member, channel)) {
            return this.FLAGS.NO_PERMISSION;
        } else {
            member.voice.setChannel(channel);
            return this.FLAGS.SUCCESSFULLY_JOINED;
        }
    }
    isJoinableBy(member, channel) {
        return member.permissionsIn(channel).has('CONNECT')
    }
    sendMessage(message, timeout = 5000) {
        this.fetchChannel().send(message).then(msg => msg.delete({timeout: timeout}));
    }
    fetchChannel() {
        return this.channels.cache.find(channel => channel.name == this.channel)
    }
}