var vorpal = require('vorpal')(),
    DataStore = require('nedb'),
    cache = new DataStore(),
    nconf = require('nconf'),
    colors = require('colors'),
    api = require('./TwitterAPI'),
    twitter = require('twitter-text');

nconf.argv()
    .env()
    .file({ file: 'config.json' });

vorpal.commands = [];

vorpal
    .command('/exit', 'Exit ntwt')
    .action(function(args) {
        args.options = args.options || {};
        args.options.sessionId = this.session.id;
        this.parent.exit(args.options);
    });

vorpal
    .command('/show <id>', 'Show cached tweet by id')
    .option('--debug', 'Show full tweet object')
    .action(function(args, callback) {
        var id = args.id || -1;
        const self = this;

        cache.findOne({ id: id }, function(err, doc) {
            if (doc.type != 'status') return;
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }
            var status = doc.status;
            if (args.options.debug) {
                self.log(status);
            } else {
                var log = '\n';
                log += '|\tUser: ' + status.user.name + ' (@' + status.user.screen_name + ')\n';
                log += '|\t\n';
                log += '|\tText: ' + status.text + '\n';
                log += '|\tCreated At: ' + status.created_at + '\n';
                log += '|\tFavorites: ' + (status.favorite_count || '0') + '\n';
                log += '|\tRetweets: ' + (status.retweet_count || '0') + '\n';
                if (status.place) {
                    log += '|\tLocation: ' + place.full_name + '\n';
                }
                if (status.coordinates) {
                    var coordinates = status.coordinates[0];
                    log += '|\tLocation (Coordinates): ' + coordinates[0] + ', ' + coordinates[1] + '\n';
                }
                log += '|\tSource: ' + status.source + '\n';
                self.log(log);
            }
        });
        callback();
    });

vorpal
    .command('/delete <id>', 'Delete a tweet')
    .action(function(args, callback) {
        var id = args.id || -1;
        const self = this;

        cache.findOne({ id: id }, function(err, doc) {
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }
            if (doc.type == 'status') {
                api.delete(doc.status);
                //TODO delete from cache?
            } else {
                self.log('Warning: Unsupported command for this element.'.red);
            }
        });
        callback();
    });

vorpal
    .command('/again [screen_name]', 'Reload home timeline or specified users timeline')
    .action(function(args, callback) {
        api.loadTimeline(args.screen_name);
        callback();
    });

vorpal
    .command('/dms', 'Show DMs')
    .action(function(args, callback) {
        api.loadDMs();
        callback();
    });

vorpal
    .command('/replies', 'Show latest 20 mentions')
    .action(function(args, callback) {
        api.loadReplies();
        callback();
    });

vorpal
    .command('/search <query>', 'Search')
    .action(function(args, callback) {
        api.search(args.query);
        callback();
    });

vorpal
    .command('/retweet <id>', 'Retweet status with id')
    .alias('/rt')
    .action(function(args, callback) {
        const self = this;
        cache.findOne({ id: args.id }, function(err, doc) {
            if (doc.type != 'status') return;
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }
            api.retweet(doc.status.id_str);
        });
        callback();
    });

vorpal
    .command('/like <id>', 'Like/Favorite status with id')
    .alias('/fav')
    .action(function(args, callback) {
        const self = this;
        cache.findOne({ id: args.id }, function(err, doc) {
            if (doc.type != 'status') return;
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }
            api.like(doc.status.id_str);
        });
        callback();
    });

vorpal
    .command('/unlike <id>', 'Remove like/favorite from status with id')
    .alias('/unfav')
    .action(function(args, callback) {
        const self = this;
        cache.findOne({ id: args.id }, function(err, doc) {
            if (doc.type != 'status') return;
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }
            api.unlike(doc.status.id_str);
        });
        callback();
    });

vorpal
    .command('/follow <screen_name>', 'Follow user with given name')
    .action(function(args, callback) {
        api.follow(args.screen_name);
        callback();
    });

vorpal
    .command('/unfollow <screen_name>', 'Unfollow user with given name')
    .action(function(args, callback) {
        api.unfollow(args.screen_name);
        callback();
    });

vorpal
    .command('/reply <id> <text...>', 'Reply to a tweet')
    .alias('/re')
    .action(function(args, callback) {
        const self = this;
        if (!args.id || !args.text) {
            callback();
            return;
        }
        var id = args.id;
        var text = args.text;

        text = text.join(' ');

        cache.findOne({ id: id }, function(err, doc) {
            if (err) {
                self.log(('Error: ' + err).red);
                return;
            }

            if (doc.type == 'status') {
                var status = doc.status;

                for (var m in status.entities.user_mentions) {
                    var mention = status.entities.user_mentions[m];
                    if (text.indexOf(mention.screen_name) < 0) {
                        if (mention.screen_name == api.ME.screen_name) continue;
                        text = '@' + mention.screen_name + ' ' + text;
                    }
                }
                if (text.indexOf(status.user.screen_name) < 0) {
                    text = '@' + status.user.screen_name + ' ' + text;
                }

                api.reply(text, status.id_str);
            } else {
                self.log('Warning: Unsupported command for this element.'.red);
            }
        });
        callback();
    });

vorpal
    .command('/thread <id>', 'Show Conversation')
    .action(function(args, callback) {
        var id = args.id || -1;
        const self = this;

        cache.findOne({ id: id }, function(err, doc) {
            if (doc.type != 'status') return;
            if (err) {
                err = err || "not authorized";
                self.log(('Error: ' + err).red);
                return;
            }
            api.loadConversation(doc.status);
        });
        callback();
    });

vorpal
    .command('/login')
    .description('Authenticate with your Twitter account')
    .action(function(arg, callback) {
        const self = this;

        var TwitterPinAuth = require('twitter-pin-auth');
        twitterPinAuth = new TwitterPinAuth(
            nconf.get('auth:consumer_key'),
            nconf.get('auth:consumer_secret'));

        twitterPinAuth.requestAuthUrl()
            .then(function(url) {
                self.log("Login and copy the PIN number: ".yellow + url.underline);
            })
            .catch(function(err) {
                self.log(('Error: ' + err).red);
            });

        this.prompt({
            type: 'input',
            name: 'pin',
            default: null,
            message: 'PIN: '
        }, function(result) {
            if (!result.pin) return;
            twitterPinAuth.authorize(result.pin)
                .then(function(data) {
                    nconf.set('auth:access_token', data.accessTokenKey);
                    nconf.set('auth:access_token_secret', data.accessTokenSecret);

                    self.log('Saving access token...'.blue);
                    nconf.save();

                    self.log("Authentication successfull!\n\n".green.bold);

                    self.log('Logging in...'.blue);

                    api.login(nconf.get('auth:consumer_key'),
                        nconf.get('auth:consumer_secret'),
                        nconf.get('auth:access_token'),
                        nconf.get('auth:access_token_secret'),
                        vorpal, cache);
                    api.startStream();

                    callback();
                })
                .catch(function(err) {
                    self.log('Authentication failed!'.red);
                    self.log(err);
                    callback();
                });
        });
    });

vorpal
    .command('/dm <screen_name> <words...>]')
    .description('Send direct message')
    .action(function(args, callback) {
        var screen_name = args.screen_name;
        var message = args.words.join(' ');
        api.message(screen_name, message);
        callback();
    });

vorpal
    .catch('[words...]', 'Tweet')
    .action(function(args, callback) {
        if (!args.words) return;

        var status = args.words.join(' ');
        api.update(status);
        callback();
    });

vorpal
    .on('keypress', function(event) {
        var current = this.ui.delimiter();
        if (current == 'PIN: ') return;

        var p = this.ui.input();
        if (!p || p.length == 0 || p.charAt(0) == '/') {
            this.ui.delimiter('ntwt [---]> ');
        } else {
            var pad = '000';
            var _c = 140 - twitter.getTweetLength(p);
            if (_c < 0) _c = 0;

            var _s = (pad + _c).slice(-pad.length);
            if (_c <= 15) _s = _s.red;

            this.ui.delimiter('ntwt [' + _s + ']> ');
        }
    });

vorpal.log('Welcome to ntwt!');

if (!nconf.get('auth:access_token') || !nconf.get('auth:access_token_secret')) {
    vorpal.log('Type /login to authenticate with Twitter.'.green);
} else {
    vorpal.log('Logging in...'.blue);

    api.login(nconf.get('auth:consumer_key'),
              nconf.get('auth:consumer_secret'),
              nconf.get('auth:access_token'),
              nconf.get('auth:access_token_secret'),
              vorpal, cache);
    api.startStream();
}



vorpal
    .delimiter('ntwt [---]>')
    .show();
