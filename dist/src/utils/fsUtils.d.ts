declare namespace _default {
    /**
     * returns the local cache dir
     * @returns {String}
     */
    function getCacheDir(): string;
    /**
     * returns the local cache dir
     * @returns {String}
     */
    function getCacheDir(): string;
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
    function downloadFile(fromUrl: any, toFile: any, headers: any, callbacks: any): Promise<any>;
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
    function downloadFile(fromUrl: any, toFile: any, headers: any, callbacks: any): Promise<any>;
    /**
     * remove the file in filePath if it exists.
     * this method always resolves
     * @param filePath
     * @returns {Promise}
     */
    function deleteFile(filePath: any): Promise<any>;
    /**
     * remove the file in filePath if it exists.
     * this method always resolves
     * @param filePath
     * @returns {Promise}
     */
    function deleteFile(filePath: any): Promise<any>;
    /**
     * copy a file from fromFile to toFile
     * @param fromFile
     * @param toFile
     * @returns {Promise}
     */
    function copyFile(fromFile: any, toFile: any): Promise<any>;
    /**
     * copy a file from fromFile to toFile
     * @param fromFile
     * @param toFile
     * @returns {Promise}
     */
    function copyFile(fromFile: any, toFile: any): Promise<any>;
    /**
     * remove the contents of dirPath
     * @param dirPath
     * @returns {Promise}
     */
    function cleanDir(dirPath: any): Promise<any>;
    /**
     * remove the contents of dirPath
     * @param dirPath
     * @returns {Promise}
     */
    function cleanDir(dirPath: any): Promise<any>;
    /**
     * get info about files in a folder
     * @param dirPath
     * @returns {Promise.<{file:Array, size:Number}>}
     */
    function getDirInfo(dirPath: any): Promise<{
        file: any[];
        size: number;
    }>;
    /**
     * get info about files in a folder
     * @param dirPath
     * @returns {Promise.<{file:Array, size:Number}>}
     */
    function getDirInfo(dirPath: any): Promise<{
        file: any[];
        size: number;
    }>;
    function exists(path: any): any;
    function exists(path: any): any;
}
export default _default;
