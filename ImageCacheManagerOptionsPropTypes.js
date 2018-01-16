'use strict';

const PropTypes = require('prop-types');

module.exports = {
    headers: PropTypes.object,
    ttl: PropTypes.number,
    useQueryParamsInCacheKey: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    cacheLocation: PropTypes.string,
    allowSelfSignedSSL: PropTypes.bool
};
