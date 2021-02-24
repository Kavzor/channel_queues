const ChannelBot = require('./channel_bot')

module.exports = class Maja extends ChannelBot {
    constructor(prefix, channel) {
        super("Maja", channel);
        this.prefix = prefix;
        this.queue = [];
        this.commands = {
            'que': this.queueUser.bind(this)
        };
    }    
    receiveMessage(message) {
        if(message.channel.name != this.channel || message.author.username == this.user.username) {
            return false;
        }
        var args = message.content.substring(1).split(' ');
        if (message.content[0] !== this.prefix){
            this.sendReply('Prefix your query with $, see commands in $help', message, 5000, 5000);
        } else if(args[0] == "help") {
            this.sendReply('Available commands: $que <voice channel name>', message, 5000);
        } else if(!this.commands[args[0]]) {
            this.sendReply("Message not received, see the command list in $help", message, 5000, 5000);
        } else {
            this.commands[args[0]](message, args.splice(1), args[0]);
        }
    }
    queueUser(message, args) {
        if(!message.member.voice.channel) {
            this.sendReply("You are not in a voice channel", message, 5000, 5000);
        } 
        /*else if(message.member.voice.channel.name != "Queue") {
            this.sendReply("You must be connected to the Queue voice server to enter the queue list", message, 5000, 5000);
        }*/
        else {
            let channel = this.findChannelMatch(args.join(" "));
            let join_status = this.attemptVoiceJoin(message.member, channel);
            if(join_status == this.FLAGS.SUCCESSFULLY_JOINED){
                this.sendReply("<@" + message.member.user.id + ">\nThere was a vacant spot, you been moved there", message, 7000, 1000);
            } else if(join_status == this.FLAGS.NO_PERMISSION || join_status == this.FLAGS.NOT_FOUND) {
                this.logInfo(message.member.user.id + " attempted to connect to " + channel.name);
                this.sendReply("<@" + message.member.user.id + ">\nCould not find the channel you are looking for, specify the name again", message, 7000, 1000);
            } else if(join_status == this.FLAGS.VOICE_FULL) {
                this.queue.push({member: message.member, channel: channel});
                this.sendReply("<@" + message.member.user.id + ">\nYou have been added to the queue, advise it for your position", message, 7000, 1000);
                this.updateQueueList();
            }
        }
    }
    queryQueue(oldState, newState) {
        if(!newState.member.voice.channel) {
            let entry = this.queue.find(entry => entry.member.user.id = newState.member.id);
            this.removeFromQueue(entry.member);
            this.sendMessage("<@" + entry.member.user.id + ">\nYou have been removed from the queue due to leaving voice");
            this.updateQueueList();
        } else if(oldState.channel) {
            let entry = this.queue.find(entry => entry.channel.id === oldState.channel.id);
            if(entry && this.attemptVoiceJoin(entry.member, oldState.channel)) {
                this.removeFromQueue(entry.member);
                this.sendMessage("<@" + entry.member.user.id + ">\nSuccessfully moved you to " + oldState.channel.name);
            }
            this.updateQueueList();
        }
    }
    removeFromQueue(member) {
        this.queue = this.queue.filter(filterEntry => filterEntry.member.user.id !== member.user.id);
    }
    updateQueueList() {
        let queuedUsers = "```### Queue list ###\n";
        let positions = []
        this.queue.forEach(entry => {
            positions[entry.channel.name] = positions[entry.channel.name] ? positions[entry.channel.name] + 1 : 1;
            queuedUsers += entry.member.displayName + ": " + entry.channel.name + " [Position: " + positions[entry.channel.name] + "]" + "\n";
        });
        if(this.queue.length == 0) {
            queuedUsers += "The queue is currently empty";
        }
        queuedUsers += "```";

        if(!this.queueList) {
            this.fetchChannel().send(queuedUsers).then(msg => this.queueList = msg);
        } else {
            this.queueList.edit(queuedUsers);
        }
    }
}

