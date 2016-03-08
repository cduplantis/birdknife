var color = require('./color_definitions'),
    twitter = require('twitter-text'),
    birdknife_text = require('./birdknife-text');

module.exports = {
    cache: null,
    PAD: '000',

    isCommand: function(input) {
        return input.match(/^\//);
    },

    isQuote: function(input) {
        return input.match(/^\/quote\s([a-z0-9]{2})\s/);
    },

    isReply: function(input) {
        return input.match(/^\/reply\s([a-z0-9]{2})\s/);
    },

    setDelimiter: function(ui, count) {
        if (count < 0) count = 0;

        var _s = (this.PAD + count).slice(-this.PAD.length);
        if (count <= 15) _s = color.delimiter_warning(_s);
        ui.delimiter('birdknife [' + _s + ']> ');
    },

    setDefaultDelimiter: function(ui) {
        ui.delimiter('birdknife [---]> ');
    },

    set: function(vorpal, cache, api, input) {
        const self = this;
        this.cache = cache;

        var _c;

        //if input is a command but not /reply or /quote
        //noinspection OverlyComplexBooleanExpressionJS
        if (input.length === 0 || (
                this.isCommand(input) && !this.isQuote(input) && !this.isReply(input)
            )) {
            this.setDefaultDelimiter(vorpal.ui);
        }
        else if (this.isReply(input)) {
            var reply = this.isReply(input);

            var id = reply[1];
            input = input.replace(reply[0], '');
            cache.findOne({ id: id }, function(err, doc) {
                if (doc.type !== 'status') return;
                if (err) {
                    vorpal.log(color.error('Error: ' + err));
                    return;
                }

                input = birdknife_text.addMentionsToReply(api.ME.screen_name, input, doc.status);
                _c = 140 - twitter.getTweetLength(input);

                self.setDelimiter(vorpal.ui, _c);
            });
        }
        else if (this.isQuote(input)) {
            var quote = this.isQuote(input);

            var id = quote[1];
            input = input.replace(quote[0], '');
            cache.findOne({ id: id }, function(err, doc) {
                if (doc.type !== 'status') return;
                if (err) {
                    vorpal.log(color.error('Error: ' + err));
                    return;
                }

                input += ' ' + birdknife_text.getStatusURL(doc.status);
                _c = 140 - twitter.getTweetLength(input);

                self.setDelimiter(vorpal.ui, _c);
            });
        }
        else {
            _c = 140 - twitter.getTweetLength(input);
            this.setDelimiter(vorpal.ui, _c);
        }
    }
};