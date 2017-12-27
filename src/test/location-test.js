/* eslint-disable import/no-unresolved */

import { assert } from 'chai';
import { describe, it } from 'mocha';
import Location from '../libs/location';
import Preferences from '../libs/preferences';

describe('Location', () => {
    /*
    describe('#getAutoLocation', () => {
        it('should return a valid location', () => {
            const location = Location.getLocationAuto();
            expect(location).to.have.property('lat');
            expect(location).to.have.property('lng');
        });
    });
    */

    describe('#getLocation', () => {
        it('should return false, as this is the default preference', () => {
            const location = Location.getLocation(new Preferences());
            assert.isFalse(location, 'is set to false');
        });
    });
});
