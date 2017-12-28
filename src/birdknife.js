#!/usr/bin/env node

/* eslint-disable import/no-unresolved */

import _ from 'lodash';
import Vorpal from 'vorpal';
import vorpalAutocomplete from 'vorpal-autocomplete-fs';
import updateNotifier from 'update-notifier';
import DataStore from 'nedb';
import Delimiter from './libs/delimiter';
import TwitterAPI from './libs/twitter-api';
import Color from './libs/color-definitions';
import BirdknifeText from './libs/text';
import Autocomplete from './libs/autocomplete';
import Parser from './libs/parser';
import Preferences from './libs/preferences';
import Timer from './libs/timer';

const vorpal = new Vorpal();
const store = new DataStore();
const preferences = new Preferences();
const delimiter = new Delimiter();
const pkg = require('../package.json');

const cache = {};
cache.usernames = new DataStore({
    filename: 'usernames.db',
    autoload: true
});
cache.hashtags = new DataStore({
    filename: 'hashtags.db',
    autoload: true
});

cache.usernames.ensureIndex({ fieldName: 'k', unique: true }, error => {
    if (error) vorpal.log(Color.error(`Database error: ${error}`));
});

cache.hashtags.ensureIndex({ fieldName: 'k', unique: true }, error => {
    if (error) vorpal.log(Color.error(`Database error: ${error}`));
});

const api = new TwitterAPI(preferences, vorpal, store, cache);

vorpal
    .command('/show <id>', 'Show stored tweet by id')
    .option('--debug', 'Show full tweet object')
    .action((args, callback) => {
        api.showStatus(args.id, args.options.debug, vorpal.activeCommand, callback);
    });

vorpal
    .command('/delete <id>', 'Delete a tweet')
    .alias('/del')
    .action((args, callback) => {
        api.deleteStatus(args.id, vorpal.activeCommand, callback);
    });

vorpal
    .command('/again [screen_name]', 'Reload home timeline or specified users timeline')
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Loading tweets...'));
        api.loadTimeline(args.screen_name);
        callback();
    });

vorpal
    .command('/dms', 'Show DMs')
    .option('--sent', 'Show sent DMs')
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Loading DMs...'));
        if (args.options.sent) {
            api.loadSentDMs();
        } else {
            api.loadDMs();
        }
        callback();
    });

vorpal
    .command('/replies', 'Show latest 20 mentions')
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Loading replies...'));
        api.loadReplies();
        callback();
    });

vorpal
    .command('/search <query...>', 'Search')
    .alias('/se')
    .parse(Parser.parseCommand)
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Searching...'));
        const query = Parser.postParse(args.query.join(' '));
        api.search(query);
        callback();
    });

vorpal
    .command('/retweet <id>', 'Retweet status with id')
    .alias('/rt')
    .action((args, callback) => {
        api.retweet(args.id, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/like <id>', 'Like/Favorite status with id')
    .alias('/fav')
    .action((args, callback) => {
        api.like(args.id, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/unlike <id>', 'Remove like/favorite from status with id')
    .alias('/unfav')
    .action((args, callback) => {
        api.unlike(args.id, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/follow <screen_name>', 'Follow user with given name')
    .action((args, callback) => {
        api.follow(args.screen_name);
        callback();
    });

vorpal
    .command('/unfollow <screen_name>', 'Unfollow user with given name')
    .action((args, callback) => {
        api.unfollow(args.screen_name);
        callback();
    });

vorpal
    .command('/block <screen_name>', 'Block user with given name')
    .action((args, callback) => {
        api.block(args.screen_name);
        callback();
    });

vorpal
    .command('/unblock <screen_name>', 'Unblock user with given name')
    .action((args, callback) => {
        api.unblock(args.screen_name);
        callback();
    });

vorpal
    .command('/mute <screen_name>', 'Mute user with given name')
    .action((args, callback) => {
        api.mute(args.screen_name);
        callback();
    });

vorpal
    .command('/unmute <screen_name>', 'Unmute user with given name')
    .action((args, callback) => {
        api.unmute(args.screen_name);
        callback();
    });

vorpal
    .command('/reply <id> <text...>', 'Reply to a tweet')
    .alias('/re')
    .parse(Parser.parseCommand)
    .action((args, callback) => {
        let text = args.text.join(' ');
        text = Parser.postParse(text);

        api.reply(args.id, text, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/quote <id> <text...>', 'Quote a tweet')
    .parse(Parser.parseCommand)
    .action((args, callback) => {
        let text = args.text.join(' ');
        text = Parser.postParse(text);

        api.quote(args.id, text, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/thread <id>', 'Show Conversation')
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Loading conversation. This might take a few seconds...'));

        api.loadConversation(args.id, vorpal.activeCommand);
        callback();
    });

vorpal
    .command('/logout')
    .description('Logout')
    .action((args, callback) => {
        api.logout();
        vorpal.activeCommand.log(Color.success('\nLogged out.\n'));
        vorpal.activeCommand.log(Color.green('Type /login to authenticate with Twitter.'));
        callback();
    });

vorpal
    .command('/login')
    .description('Authenticate with your Twitter account')
    .action((args, callback) => {
        api.authenticate(vorpal.activeCommand, callback);
    });

vorpal
    .command('/user <screen_name>')
    .description('Display user information')
    .action((args, callback) => {
        vorpal.activeCommand.log(Color.blue('-- Loading user information...'));
        api.loadUser(args.screen_name);
        callback();
    });

vorpal
    .command('/dm <screen_name> <words...>]')
    .description('Send direct message')
    .parse(Parser.parseCommand)
    .action((args, callback) => {
        const screenName = args.screen_name;
        let message = args.words.join(' ');
        message = Parser.postParse(message);
        api.message(screenName, message);
        callback();
    });

vorpal
    .command('/preferences', 'List all preferences')
    .action((args, callback) => {
        vorpal.activeCommand.log(preferences.toString());
        callback();
    });

vorpal
    .command('/set <key> <value>', 'Set preference by key')
    .parse(Parser.parseCommand)
    .action((args, callback) => {
        const value = typeof args.value === 'string'
            ? Parser.postParse(args.value)
            : args.value;

        if (preferences.set(args.key, value)) {
            vorpal.activeCommand.log(Color.blue(`${args.key} is now set to ${preferences.get(args.key)}`));
        } else {
            vorpal.activeCommand.log(Color.error(`Error: ${args.key} is not a valid key!`));
        }
        callback();
    });

const expPrompt = (cmd, cb, dirs, status = '') => {
    const _c = BirdknifeText.getRemainingTweetLength(status);
    const _s = (Delimiter.PAD + _c).slice(-Delimiter.PAD.length);
    return cmd.prompt({
        type: 'input',
        name: 'tweet',
        default: null,
        message: `Tweet [${_s}]> `
    }, result => {
        if (result.tweet === '/cancel') {
            cb();
        } else if (result.tweet === '/send') {
            api.updateWithMedia(status, dirs);
            cb();
        } else if (result.tweet !== '/send') {
            status += '\n' + result.tweet;
            delimiter.updateExplicitCount(status);
            expPrompt(cmd, cb, dirs, status);
        }
    });
};

vorpal
    .command('/tweet [dirs...]', 'Tweet (optional: add media)')
    .autocomplete(vorpalAutocomplete())
    .action((args, callback) => {
        vorpal.activeCommand.log(
            Color.yellow('\nEnter ') +
            Color.blue('/send ') +
            Color.yellow('to update your status or ') +
            Color.red('/cancel') +
            Color.yellow(' to return to the main prompt.')
        );

        delimiter.updateExplicitCount('');
        expPrompt(vorpal.activeCommand, callback);
    });

vorpal
    .catch('[words...]', 'Tweet')
    .parse(Parser.parseStatus)
    .action((args, callback) => {
        let status = args.words.join(' ');
        status = Parser.postParse(status);

        api.tweet(status, vorpal.activeCommand, callback);
    });

vorpal
    .on('keypress', function (event) {
        if (this.ui.delimiter() === 'PIN: ') return;
        const explicit = this.ui.delimiter().startsWith('Tweet');
        if (event.key === 'tab') Autocomplete.autocomplete(this, cache);
        delimiter.set(this, store, api, this.ui.input(), explicit);
    });

const help = vorpal.find('help');
const exit = vorpal.find('exit');

if (help) help.remove();
if (exit) exit.remove();

vorpal
    .command('/exit')
    .alias('/quit')
    .description('Exits birdknife.')
    .action(args => {
        args.options = args.options || {};
        args.options.sessionId = vorpal.activeCommand.session.id;
        vorpal.activeCommand.parent.exit(args.options);
    });

vorpal
    .command('/help [command...]')
    .description('Provides help for a given command.')
    .action((args, cb) => {
        if (args.command) {
            args.command = args.command.join(' ');
            const name = _.find(vorpal.activeCommand.parent.commands, { _name: String(args.command).toLowerCase().trim() });
            if (name && !name._hidden) {
                if (_.isFunction(name._help)) {
                    name._help(args.command, str => {
                        vorpal.activeCommand.log(str);
                        cb();
                    });
                    return;
                }
                vorpal.activeCommand.log(name.helpInformation());
            } else {
                vorpal.activeCommand.log(vorpal.activeCommand.parent._commandHelp(args.command));
            }
        } else {
            vorpal.activeCommand.log(vorpal.activeCommand.parent._commandHelp(args.command));
        }
        cb();
    });

vorpal.history('birdknife');

vorpal.log(`Welcome to birdknife! (${pkg.version})`);

updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 /* every day */ }).notify();

new Timer(vorpal, preferences).start();

if (preferences.checkAccessToken()) {
    vorpal.log(Color.blue('Logging in...'));
    api.login();
} else {
    vorpal.log(Color.green('Type /login to authenticate with Twitter.'));
}

vorpal
    .delimiter('birdknife [---]>')
    .show();
