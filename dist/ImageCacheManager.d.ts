import { ObjectLiteral } from './typings';
declare const ImageCacheManager: (defaultOptions?: {}, urlCache?: any, fs?: {
    getCacheDir(): string;
    downloadFile(fromUrl: any, toFile: any, headers: any, callbacks: any): Promise<any>;
    deleteFile(filePath: any): Promise<any>;
    copyFile(fromFile: any, toFile: any): Promise<any>;
    cleanDir(dirPath: any): Promise<any>;
    getDirInfo(dirPath: any): Promise<{
        file: any[];
        size: number;
    }>;
    exists(path: any): Promise<boolean>;
}, path?: {
    getImageFilePath(url: any, cacheLocation: any): string;
    getImageRelativeFilePath(url: any): string;
    getCacheableUrl(url: any, useQueryParamsInCacheKey: any): string;
}) => {
    /**
     * download an image and cache the result according to the given options
     * @param url
     * @param options
     * @returns {Promise}
     */
    downloadAndCacheUrl: (url: string, options?: TOptions | undefined, callbacks?: any) => any;
    /**
     * seed the cache for a specific url with a local file
     * @param url
     * @param seedPath
     * @param options
     * @returns {Promise}
     */
    seedAndCacheUrl: (url: string, seedPath: string, options?: TOptions | undefined) => any;
    /**
     * delete the cache entry and file for a given url
     * @param url
     * @param options
     * @returns {Promise}
     */
    deleteUrl: (url: string, options?: TOptions | undefined) => any;
    /**
     * delete all cached file from the filesystem and cache
     * @param options
     * @returns {Promise}
     */
    clearCache: (options?: TOptions | undefined) => any;
    /**
     * return info about the cache, list of files and the total size of the cache
     * @param options
     * @returns {Promise.<{file: Array, size: Number}>}
     */
    getCacheInfo: (options?: TOptions | undefined) => Promise<{
        file: any[];
        size: number;
    }>;
};
export default ImageCacheManager;
export declare type TImageCacheManager = ReturnType<typeof ImageCacheManager>;
export declare type TOptions = {
    headers?: ObjectLiteral;
    ttl?: number;
    useQueryParamsInCacheKey?: boolean | string[];
    cacheLocation?: string;
    allowSelfSignedSSL?: boolean;
};
