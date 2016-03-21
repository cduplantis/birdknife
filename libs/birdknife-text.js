var color = require('./color_definitions'),
    twitter = require('twitter-text'),
    Entities = require('html-entities').AllHtmlEntities;

var htmlEntities = new Entities();

module.exports = {

    isCommand: function(input) {
        return input.match(/^\//);
    },

    isQuote: function(input) {
        return input.match(/^\/quote\s([a-z0-9]{2})\s/);
    },

    isReply: function(input) {
        return input.match(/^\/reply\s([a-z0-9]{2})\s/);
    },

    autoBoldText: function(text, entities) {
        twitter.convertUnicodeIndices(text, entities, false);

        var result = "";
        entities.sort(function(a, b) {
            return a.indices[0] - b.indices[0];
        });

        var beginIndex = 0;
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            result += text.substring(beginIndex, entity.indices[0]);

            if (entity.type) { //Only 'photo' for now (https://dev.twitter.com/overview/api/entities-in-twitter-objects)
                result += color.bold(entity.display_url);
            } else if (entity.expanded_url) { //url
                result += color.bold(entity.expanded_url);
            } else if (entity.screen_name) { //reply
                result += color.bold('@' + entity.screen_name);
            } else if (entity.text) { //hashtag
                result += color.bold('#' + entity.text);
            }
            beginIndex = entity.indices[1];
        }
        result += text.substring(beginIndex, text.length);
        return htmlEntities.decode(result);
    },

    autoBoldStatusEntities: function(status) {
        var retweet = status.retweeted_status;
        var text = retweet ? retweet.text : status.text;
        var entities = retweet ? retweet.entities : status.entities;

        var flat_entities = [];

        for (var um in entities.user_mentions) {
            flat_entities.push(entities.user_mentions[um]);
        }
        for (var url in entities.urls) {
            flat_entities.push(entities.urls[url]);
        }
        for (var h in entities.hashtags) {
            flat_entities.push(entities.hashtags[h]);
        }
        for (var m in entities.media) {
            flat_entities.push(entities.media[m]);
        }

        return this.autoBoldText(text, flat_entities);
    },

    autoBoldBioEntities: function(user) {
        var flat_entities = [];

        for (var key in user.entities.description.urls) {
            flat_entities.push(user.entities.description.urls[key]);
        }

        return this.autoBoldText(user.description, flat_entities);
    },

    formatUserBio: function(user) {
        var description = this.autoBoldBioEntities(user);
        description = description.replace(/(?:\r\n|\r|\n)/g, '\n|\t');

        return '|\t' + description + '\n';
    },

    addMentionsToReply: function(ignore_screen_name, text, status) {
        for (var m in status.entities.user_mentions) {
            var mention = status.entities.user_mentions[m];
            if (text.indexOf(mention.screen_name) < 0) {
                if (mention.screen_name === ignore_screen_name) continue;
                text = '@' + mention.screen_name + ' ' + text;
            }
        }
        if (text.indexOf(status.user.screen_name) < 0 && status.user.screen_name !== ignore_screen_name) {
            text = '@' + status.user.screen_name + ' ' + text;
        }
        return text;
    },
    
    getStatusURL: function(status) {
        return 'https://twitter.com/' + status.user.screen_name + '/status/' + status.id_str;
    }
};
