declare const fsUtils: {
    /**
     * returns the local cache dir
     * @returns {String}
     */
    getCacheDir(): string;
    /**
     * returns a promise that is resolved when the download of the requested file
     * is complete and the file is saved.
     * if the download fails, or was stopped the partial file is deleted, and the
     * promise is rejected
     * @param fromUrl   String source url
     * @param toFile    String destination path
     * @param headers   Object with headers to use when downloading the file
     * @returns {Promise}
     */
    downloadFile(fromUrl: string, toFile: string, headers: any, callbacks: any): any;
    /**
     * remove the file in filePath if it exists.
     * this method always resolves
     * @param filePath
     * @returns {Promise}
     */
    deleteFile(filePath: string): Promise<any>;
    /**
     * copy a file from fromFile to toFile
     * @param fromFile
     * @param toFile
     * @returns {Promise}
     */
    copyFile(fromFile: string, toFile: string): Promise<boolean>;
    /**
     * remove the contents of dirPath
     * @param dirPath
     * @returns {Promise}
     */
    cleanDir(dirPath: string): Promise<void | undefined>;
    /**
     * get info about files in a folder
     * @param dirPath
     * @returns {Promise.<{file:Array, size:Number}>}
     */
    getDirInfo(dirPath: string): Promise<{
        files: unknown[];
        size: number;
    }>;
    exists(path: string): Promise<boolean>;
};
export default fsUtils;
