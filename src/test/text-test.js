/* eslint-disable import/no-unresolved */

import { expect, assert } from 'chai';
import { describe, it } from 'mocha';
import BirdknifeText from '../libs/text';
import DummyStatus from './DummyStatus';

describe('BirdknifeText', () => {
    describe('#isCommand', () => {
        it('recognizes commands', () => {
            const c1 = BirdknifeText.isCommand('/a');
            const c2 = BirdknifeText.isCommand('/reply');
            const c3 = BirdknifeText.isCommand('/asdofi4329 arg1 arg2');

            assert.isTrue(c1, 'is a command');
            assert.isTrue(c2, 'is a command');
            assert.isTrue(c3, 'is a command');

            const s1 = BirdknifeText.isCommand('reply');
            const s2 = BirdknifeText.isCommand('reply arg1 arg2');
            const s3 = BirdknifeText.isCommand('reply /command');

            assert.isFalse(s1, 'is not a command');
            assert.isFalse(s2, 'is not a command');
            assert.isFalse(s3, 'is not a command');
        });
    });

    describe('#isQuote', () => {
        it('recognizes quote commands', () => {
            const q1 = BirdknifeText.isQuote('/quote a0 ');
            const q2 = BirdknifeText.isQuote('/quote be This is a comment');
            const q3 = BirdknifeText.isQuote('/quote ax try /quote');
            const q4 = BirdknifeText.isQuote('/quote zz ');

            assert.isTrue(q1, 'is a quote command');
            assert.isTrue(q2, 'is a quote command');
            assert.isTrue(q3, 'is a quote command');
            assert.isTrue(q4, 'is a quote command');

            const nq1 = BirdknifeText.isQuote('a');
            const nq2 = BirdknifeText.isQuote('/a');
            const nq3 = BirdknifeText.isQuote('/quote');
            const nq4 = BirdknifeText.isQuote('/quote ai');
            const nq5 = BirdknifeText.isQuote('/quote a ');
            const nq6 = BirdknifeText.isQuote('/quote /quote c6 ');
            const nq7 = BirdknifeText.isQuote('/quote  al ');
            const nq8 = BirdknifeText.isQuote('/reply al ');

            assert.isFalse(nq1, 'is not a quote command');
            assert.isFalse(nq2, 'is not a quote command');
            assert.isFalse(nq3, 'is not a quote command');
            assert.isFalse(nq4, 'is not a quote command');
            assert.isFalse(nq5, 'is not a quote command');
            assert.isFalse(nq6, 'is not a quote command');
            assert.isFalse(nq7, 'is not a quote command');
            assert.isFalse(nq8, 'is not a quote command');
        });
    });

    describe('#isReply', () => {
        it('recognizes reply commands', () => {
            const r1 = BirdknifeText.isReply('/reply a0 ');
            const r2 = BirdknifeText.isReply('/reply be This is a reply');
            const r3 = BirdknifeText.isReply('/reply ax try /quote');
            const r4 = BirdknifeText.isReply('/reply zz ');

            assert.isTrue(r1, 'is a reply command');
            assert.isTrue(r2, 'is a reply command');
            assert.isTrue(r3, 'is a reply command');
            assert.isTrue(r4, 'is a reply command');

            const nr1 = BirdknifeText.isReply('a');
            const nr2 = BirdknifeText.isReply('/a');
            const nr3 = BirdknifeText.isReply('/reply');
            const nr4 = BirdknifeText.isReply('/reply ai');
            const nr5 = BirdknifeText.isReply('/reply a ');
            const nr6 = BirdknifeText.isReply('/reply /reply c6 ');
            const nr7 = BirdknifeText.isReply('/reply  al ');
            const nr8 = BirdknifeText.isReply('/quote al ');

            assert.isFalse(nr1, 'is not a reply command');
            assert.isFalse(nr2, 'is not a reply command');
            assert.isFalse(nr3, 'is not a reply command');
            assert.isFalse(nr4, 'is not a reply command');
            assert.isFalse(nr5, 'is not a reply command');
            assert.isFalse(nr6, 'is not a reply command');
            assert.isFalse(nr7, 'is not a reply command');
            assert.isFalse(nr8, 'is not a reply command');
        });
    });

    describe('#getStatusURL', () => {
        it('returns a valid status url', () => {
            const ex = 'https://twitter.com/screenname/status/123456789012345678';

            /* eslint-disable camelcase */
            const dummy = {
                id_str: '123456789012345678',
                user: {
                    screen_name: 'screenname'
                }
            };
            /* eslint-enable camelcase */
            const res = BirdknifeText.getStatusURL(dummy);

            expect(res).to.equal(ex);
        });
    });

    describe('#autoBoldStatusEntities', () => {
        it('bolds entities in a dummy status', () => {
            const text = BirdknifeText.autoBoldStatusEntities(DummyStatus);
            expect(text).to.equal(
                '\u001b[1m@_vanita5\u001b[22m asdf \u001b[1m#odersp\u001b[22m'
            );
        });
    });
});

