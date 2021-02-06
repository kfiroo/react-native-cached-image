/// <reference types="react" />
import { ImageProps, StyleSheetProperties } from 'react-native';
import { TOptions } from '../ImageCacheManager';
import { ObjectLiteral } from '../typings';
declare type Props = ImageProps & /*  ImageCacheManager options */ {
    cacheManagerOptions?: TOptions;
    loadingIndicatorProps?: ObjectLiteral;
    callbacks?: {
        onStartDownloading: () => any;
        onFinishDownloading: () => any;
        progressTracker?: () => any;
    };
    LoadingIndicator?: (args: any) => JSX.Element;
    style?: StyleSheetProperties;
    fallbackSource?: string;
};
declare const CachedImage: ({ LoadingIndicator, fallbackSource, loadingIndicatorProps, callbacks, style, cacheManagerOptions, defaultSource, ...imageProps }: Props) => JSX.Element;
export default CachedImage;
