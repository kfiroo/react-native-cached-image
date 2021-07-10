import get from 'lodash/get'

const localizations = {
  fs_utils: {
    invalid_loc: 'Invalid cacheLocation',
    download_file: {
      unreachable: "Couldn't retreive the image asset",
      incomplete: 'Image asset is not fully downloaded',
      failure: 'Download failed'
    }
  },
  path_utils: {}
}

export const translate = (path: string): string =>
  get(localizations, path, 'Missing Translation')
