/* eslint-disable import/no-unresolved */

import twitter from 'twitter-text';
import Color from './color-definitions';
import BirdknifeText from './text';

const PAD = '000';

const PREFIX = 'birdknife';
const PREFIX_EXPLICIT = 'Tweet';

class Delimiter {

    constructor() {
        this.explicitCount = 0;
    }

    /**
     * @return {string}
     */
    static get PAD() {
        return PAD;
    }

    /**
     * Update explicit count
     *
     * @param status
     * @param withMedia
     */
    updateExplicitCount(status) {
        this.explicitCount = BirdknifeText.getTweetLength(status);
    }

    /**
     * Set delimiter of the UI
     *
     * @param ui
     * @param count
     * @param explicit
     */
    setDelimiter(ui, count, explicit) {
        if (count < 0) count = 0;

        const pre = explicit ? PREFIX_EXPLICIT : PREFIX;

        let _s = (PAD + count).slice(-PAD.length);
        if (count <= 15) _s = Color.delimiterWarning(_s);
        ui.delimiter(`${pre} [${_s}]> `);
    }

    /**
     * Set delimiter of the UI to default
     *
     * @param ui
     * @param explicit
     */
    setDefaultDelimiter(ui, explicit) {
        if (explicit) ui.delimiter(`${PREFIX_EXPLICIT} [${twitter.configs.defaults.maxWeightedTweetLength}]> `);
        else ui.delimiter(`${PREFIX} [---]> `);
    }

    /**
     * Set delimiter depending on the input
     *
     * @param vorpal
     * @param store
     * @param api
     * @param input
     * @param explicit
     */
    set(vorpal, store, api, input, explicit) {
        const self = this;
        let _c;
        let id;

        // if input is a command but not /reply or /quote
        if (input.length === 0 || (
                BirdknifeText.isCommand(input) && !BirdknifeText.isQuote(input) && !BirdknifeText.isReply(input)
            )) {
            this.setDefaultDelimiter(vorpal.ui, explicit);
            return;
        }

        // if input is a reply
        if (!explicit && BirdknifeText.isReply(input)) {
            const reply = BirdknifeText.isReply(input);

            id = reply[1];
            input = input.replace(reply[0], '');

            store.findOne({ id }, (err, doc) => {
                if (err) return vorpal.log(Color.error(`Error: ${err}`));
                if (!doc || doc.type !== 'status') return;

                input = BirdknifeText.addMentionsToReply(api.ME.screen_name, input, doc.status);
                _c = BirdknifeText.getRemainingTweetLength(input);

                self.setDelimiter(vorpal.ui, _c, false);
            });
            return;
        }

        // if input is a quote
        if (!explicit && BirdknifeText.isQuote(input)) {
            const quote = BirdknifeText.isQuote(input);

            id = quote[1];
            input = input.replace(quote[0], '');
            store.findOne({ id }, (err, doc) => {
                if (err) return vorpal.log(Color.error(`Error: ${err}`));
                if (!doc || doc.type !== 'status') return;

                input += ' ' + BirdknifeText.getStatusURL(doc.status);
                _c = BirdknifeText.getRemainingTweetLength(input);

                self.setDelimiter(vorpal.ui, _c, false);
            });
            return;
        }

        // else
        _c = BirdknifeText.getRemainingTweetLength(input);
        _c -= this.explicitCount;
        this.setDelimiter(vorpal.ui, _c, explicit);
    }
}

export default Delimiter;
