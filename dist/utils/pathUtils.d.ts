declare const pathUtils: {
    /**
     * Given a URL and some options returns the file path in the file system corresponding to it's cached image location
     * @param url
     * @param cacheLocation
     * @returns {string}
     */
    getImageFilePath(url: any, cacheLocation: string | undefined): string;
    /**
     * Given a URL returns the relative file path combined from host and url hash
     * @param url
     * @returns {string}
     */
    getImageRelativeFilePath(url: any): string;
    /**
     * returns the url after removing all unused query params
     * @param url
     * @param useQueryParamsInCacheKey
     * @returns {string}
     */
    getCacheableUrl(url: string, useQueryParamsInCacheKey: boolean | string[] | undefined): any;
};
export default pathUtils;
