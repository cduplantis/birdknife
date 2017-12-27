// import request from 'sync-request';

// const url = 'https://maps.googleapis.com/maps/api/browserlocation/json?browser=birdknife&sensor=true';

class Location {

    /**
     * Get location from Google API
     *
     * @returns {*}
     */
    /*
    static getLocationAuto() {
        const res = request('GET', url);

        if (res.statusCode !== 200) return false;

        const body = res.body.toString();
        const json = JSON.parse(body);

        return json.location || false;
    }
    */

    /**
     * Get location
     *
     * @param preferences
     * @returns {*}
     */
    static getLocation(preferences) {
        const pref = preferences.get('location');

        // allowed values are false, 'auto' (or true), { lat: 0.0, lng: 0.0 }
        if (pref && pref.constructor === Object) return pref;
        if (pref === 'auto' || pref === true) return this.getLocationAuto();
        return false;
    }
}

export default Location;
