/* eslint-disable import/no-unresolved */

import Color from './color-definitions';

class Autocomplete {

    /**
     * Autocomplete usernames and hashtags
     *
     * @param vorpal
     * @param cache
     */
    static autocomplete(vorpal, cache) {
        const input = vorpal.ui.input();

        if (input.charAt(input.length - 1) === ' ') return;

        const words = input.split(' ');
        let word = words[words.length - 1];

        const db = Autocomplete._getDb(word.charAt(0), cache);
        if (!db) return;

        /* eslint-disable no-useless-escape */
        word = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`^${word}.+`);

        db.find({ k: { $regex: re } }, { k: 1, _id: 0 })
            .sort({ count: -1 })
            .limit(5)
            .exec((err, docs) => {
                if (err) vorpal.log(Color.error(`Error: ${err}`));
                if (!docs || docs.length === 0) return;

                if (docs.length === 1) {
                    let inp;
                    words.pop(); // remove last element
                    if (words.length > 0) {
                        inp = words.join(' ') + ' ' + docs[0].k + ' ';
                    } else {
                        inp = docs[0].k + ' ';
                    }
                    vorpal.ui.input(inp);
                } else {
                    let suggestions = '';
                    for (const suggestion of docs) {
                        suggestions += suggestion.k + ' ';
                    }
                    vorpal.ui.imprint();
                    vorpal.log(suggestions);
                }
            });
    }

    /**
     * Get db based on the prefix
     *
     * Either usernames (@) or hashtags (#)
     *
     * @param prefix
     * @param cache
     * @return {*}
     * @private
     */
    static _getDb(prefix, cache) {
        let db;
        switch (prefix) {
            case '@':
                db = cache.usernames;
                break;
            case '#':
                db = cache.hashtags;
                break;
            default:
                break;
        }
        return db;
    }
}

export default Autocomplete;
