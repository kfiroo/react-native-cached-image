import { TImageCacheManager } from "./ImageCacheManager";
export declare type TPreloader = ReturnType<typeof createPreloader>;
declare const createPreloader: (list: string[]) => {
    next: () => string | undefined;
};
/**
 * download and cache an list of urls
 * @param urls
 * @param imageCacheManager
 * @param numberOfConcurrentPreloads
 * @returns {Promise}
 */
export declare const preloadImages: (urls: string[], imageCacheManager: TImageCacheManager, numberOfConcurrentPreloads: number) => Promise<any[]>;
export {};
