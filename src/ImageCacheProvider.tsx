import { noop } from "lodash";
import { Children, useEffect, useCallback, useRef } from "react";
import ImageCacheManager, { TOptions } from "./ImageCacheManager";
import * as ImageCachePreloader from "./ImageCachePreloader";

type Props =
  /*ImageCacheManager options */
  TOptions & {
    // only a single child so we can render it without adding a View
    children: any;
    // Preload urls
    urlsToPreload: string[];
    numberOfConcurrentPreloads?: number;
    onPreloadComplete?: any;
  };

const ImageCacheProvider = ({
  children,
  urlsToPreload = [],
  numberOfConcurrentPreloads = 0,
  onPreloadComplete = noop,
  ...imageCacheManagerOptions
}: Props) => {
  const { current: imageCacheManager } = useRef(
    ImageCacheManager(imageCacheManagerOptions)
  );

  const preloadImages = useCallback((urlsToPreload) => {
    ImageCachePreloader.preloadImages(
      urlsToPreload,
      imageCacheManager,
      numberOfConcurrentPreloads || -1
    ).then(() => onPreloadComplete());
  }, []);

  useEffect(() => {
    preloadImages(urlsToPreload);
  }, [urlsToPreload, preloadImages]);

  return Children.only(children);
};

export default ImageCacheProvider;
