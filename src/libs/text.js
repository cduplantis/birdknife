/* eslint-disable import/no-unresolved */

import util from 'util';
import twitter from 'twitter-text';
import Entities from 'html-entities';
import Color from './color-definitions';

const HtmlEntities = new Entities.AllHtmlEntities();

const STATUS_URL = 'https://twitter.com/%s/status/%s';

class BirdknifeText {

    /**
     * Get remaining tweet length
     *
     * @param status
     * @param withMedia
     * @returns {number}
     */
    static getRemainingTweetLength(status) {
        return twitter.configs.defaults.maxWeightedTweetLength -
            BirdknifeText.getTweetLength(status);
    }

    /**
     * Get tweet length
     *
     * @param status
     * @param withMedia
     * @return {number}
     */
    static getTweetLength(status) {
        return twitter.getTweetLength(status);
    }

    /**
     * Check if input is a command
     * (starts with "/")
     *
     * @param input
     * @returns {*|String|Array|{index: number, input: string}}
     */
    static isCommand(input) {
        const reg = /^\//;
        return reg.test(input);
    }

    /**
     * Check if input is a quote command
     * (starts with "/quote" and an id)
     *
     * @param input
     * @returns {*|String|Array|{index: number, input: string}}
     */
    static isQuote(input) {
        const reg = /^\/quote\s([a-z0-9]{2})\s/;
        return reg.test(input);
    }

    /**
     * Check if input is a reply command
     * (starts with "/reply" and an id)
     *
     * @param input
     * @returns {*|String|Array|{index: number, input: string}}
     */
    static isReply(input) {
        const reg = /^\/re(ply)?\s([a-z0-9]{2})\s/;
        return reg.test(input);
    }

    /**
     * Bold entities in text
     *
     * @param text
     * @param entities
     * @returns {string}
     */
    static autoBoldText(text, entities) {
        if (!entities) return;
        twitter.convertUnicodeIndices(text, entities, false);

        let result = '';
        entities.sort((a, b) =>
            a.indices[0] - b.indices[0]
        );

        let beginIndex = 0;
        for (const entity of entities) {
            result += text.substring(beginIndex, entity.indices[0]);
            if (entity.type) { // Only 'photo' for now (https://dev.twitter.com/overview/api/entities-in-twitter-objects)
                result += Color.bold(entity.display_url);
            } else if (entity.expanded_url) { // url
                result += Color.bold(entity.expanded_url);
            } else if (entity.screen_name) { // reply
                result += Color.bold('@' + entity.screen_name);
            } else if (entity.text) { // hashtag
                result += Color.bold('#' + entity.text);
            }
            beginIndex = entity.indices[1];
        }
        result += text.substring(beginIndex, text.length);
        return HtmlEntities.decode(result);
    }

    /**
     * Bold entities in status text
     *
     * @param status
     * @return {string}
     */
    static autoBoldStatusEntities(status) {
        const retweet = status.retweeted_status;
        const extendedTweet = retweet
            ? retweet.extended_tweet
            : status.extended_tweet;
        const text = extendedTweet
            ? extendedTweet.full_text
            : (retweet ? retweet.text : status.text);
        const entities = extendedTweet
            ? extendedTweet.entities
            : (retweet ? retweet.entities : status.entities);

        const flatEntities = [];

        if (entities.user_mentions) {
            entities.user_mentions.forEach(mention =>
                flatEntities.push(mention)
            );
        }
        if (entities.urls) {
            entities.urls.forEach(url =>
                flatEntities.push(url)
            );
        }
        if (entities.hashtags) {
            entities.hashtags.forEach(hashtag =>
                flatEntities.push(hashtag)
            );
        }
        if (entities.media) {
            entities.media.forEach(media =>
                flatEntities.push(media)
            );
        }

        return BirdknifeText.autoBoldText(text, flatEntities);
    }

    /**
     * Bold entities in user bio text
     *
     * @param user
     * @return {string}
     */
    static autoBoldBioEntities(user) {
        const flatEntities = [];

        if (user.entities.description.urls) {
            user.entities.description.urls.forEach(url =>
                flatEntities.push(url)
            );
        }

        return BirdknifeText.autoBoldText(user.description, flatEntities);
    }

    /**
     * Format user bio text
     *
     * @param user
     * @return {string}
     */
    static formatUserBio(user) {
        let description = BirdknifeText.autoBoldBioEntities(user);
        description = description.replace(/(?:\r\n|\r|\n)/g, '\n|\t');

        return `|\t${description}\n`;
    }

    /**
     * Add mentions to reply text
     *
     * @param ignoreScreenName
     * @param text
     * @param status
     * @return {string}
     */
    static addMentionsToReply(ignoreScreenName, text, status) {
        if (status.entities.user_mentions) {
            for (const mention of status.entities.user_mentions) {
                if (!text.includes(mention.screen_name)) {
                    if (mention.screen_name === ignoreScreenName) continue;
                    text = `@${mention.screen_name} ${text}`;
                }
            }
        }

        if (!text.includes(status.user.screen_name) && status.user.screen_name !== ignoreScreenName) {
            text = `@${status.user.screen_name} ${text}`;
        }
        return text;
    }

    /**
     * Get status url by status object
     *
     * @param status
     * @return {string}
     */
    static getStatusURL(status) {
        return BirdknifeText._getStatusURL(status.user.screen_name, status.id_str);
    }

    /**
     * Get status url by screen_name and id (internal)
     *
     * @param screenName
     * @param idStr
     * @private
     */
    static _getStatusURL(screenName, idStr) {
        return util.format(STATUS_URL, screenName, idStr);
    }
}

export default BirdknifeText;
