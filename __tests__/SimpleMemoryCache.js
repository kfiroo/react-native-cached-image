'use strict';

const DEFAULT_EXPIRES = 999999;

function currentTime() {
    return Math.floor((new Date().getTime() / 1000));
}

let cache = {};

const SimpleMemoryCache = {};

SimpleMemoryCache.set = (key, value, expires = DEFAULT_EXPIRES) => {
    cache[key] = {
        value: value,
        expires: currentTime() + parseInt(expires)
    };
    return Promise.resolve();
};

SimpleMemoryCache.get = (key) => {
    const curTime = currentTime();
    const v = cache[key];
    if (v && v.expires && v.expires >= curTime) {
        return Promise.resolve(v.value);
    }
    return Promise.resolve();
};

SimpleMemoryCache.remove = async (key) => {
    delete cache[key];
    return Promise.resolve();
};

SimpleMemoryCache.flush = async () => {
    cache = {};
    return Promise.resolve();
};
export default SimpleMemoryCache;