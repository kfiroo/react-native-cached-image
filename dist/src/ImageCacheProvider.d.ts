import { TOptions } from "./ImageCacheManager";
declare type Props = TOptions & {
    children: any;
    urlsToPreload: string[];
    numberOfConcurrentPreloads?: number;
    onPreloadComplete?: any;
};
declare const ImageCacheProvider: ({ children, urlsToPreload, numberOfConcurrentPreloads, onPreloadComplete, ...imageCacheManagerOptions }: Props) => any;
export default ImageCacheProvider;
