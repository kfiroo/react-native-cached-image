import { TImageCacheManager } from "./ImageCacheManager";
import times from "lodash/times";
import clone from "lodash/clone";
import noop from "lodash/noop";
export type TPreloader = ReturnType<typeof createPreloader>;

const createPreloader = (list: string[]) => {
  const urls = clone(list);
  return {
    next: () => {
      return urls.shift();
    },
  };
};

function runPreloadTask(
  prefetcher: TPreloader,
  imageCacheManager: TImageCacheManager
) {
  const url = prefetcher.next();
  if (!url) {
    return Promise.resolve();
  }
  // console.log('START', url);
  return (
    imageCacheManager
      .downloadAndCacheUrl(url)
      // allow prefetch task to fail without terminating other prefetch tasks
      .catch(noop)
      // .then(() => {
      //     console.log('END', url);
      // })
      // then run next task
      .then(() => runPreloadTask(prefetcher, imageCacheManager))
  );
}

export default {
  /**
   * download and cache an list of urls
   * @param urls
   * @param imageCacheManager
   * @param numberOfConcurrentPreloads
   * @returns {Promise}
   */
  preloadImages: (
    urls: string[],
    imageCacheManager: TImageCacheManager,
    numberOfConcurrentPreloads: number
  ) => {
    const preloader = createPreloader(urls);
    const numberOfWorkers =
      numberOfConcurrentPreloads > 0 ? numberOfConcurrentPreloads : urls.length;
    const promises = times(numberOfWorkers, () =>
      runPreloadTask(preloader, imageCacheManager)
    );
    return Promise.all(promises);
  },
};
