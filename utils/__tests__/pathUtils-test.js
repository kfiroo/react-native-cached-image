'use strict';

const _ = require('lodash');
const pathUtils = require('../pathUtils');

describe('pathUtils', () => {
  describe('getImageFilePath', () => {
    it('should resolve file.jpg with .jpg extension', () => {
      const url = 'my/path/file.jpg';
      const cacheLocation = 'foo';
      const result = pathUtils.getImageFilePath(url, cacheLocation);
      expect(_.first(result.split('/'))).toBe('foo');
      expect(_.last(result.split('.'))).toBe('jpg');
    });

    it('should resolve file.mov with .mov extension', () => {
      const url = 'my/path/file.mov';
      const cacheLocation = 'foo';
      const result = pathUtils.getImageFilePath(url, cacheLocation);
      expect(_.first(result.split('/'))).toBe('foo');
      expect(_.last(result.split('.'))).toBe('mov');
    });

    it('should resolve file without extension as .file', () => {
      const url = 'my/path/unknown';
      const result = pathUtils.getImageFilePath(url);
      expect(_.first(result.split('/'))).toBe('undefined');
      expect(_.last(result.split('.'))).toBe('file');
    });
  });
});