'use strict';
const MemoryCache = require('./CachedImage')
const ImageCacheProvider = require('./ImageCacheProvider')

let _clearDeprecated = async () => {
    try {
        let keys = await MemoryCache.getAllKeys();
        await keys.map(filePath => ImageCacheProvider.isExpired(filePath)
            .then(() => MemoryCache.deleteFile(filePath)));
    } catch (e) {}
};

setInterval(() => {
    _clearDeprecated().catch(() => {});
}, 1000);

module.exports = MemoryCache;
module.exports.ImageCacheProvider = ImageCacheProvider;
