import { Config } from '../config/config';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
//import * as gpgme from '../../gpgme/build/Debug/gpgme';

const gpgme = require('../../gpgme/build/Debug/gpgme.node');

export class Gpg {
  private gpgUser: 'NodeOrc';
  private destinationPath: string;
  private gpgmeInstance: any;
  constructor(private config: Config) {
    this.destinationPath = path.resolve('./gpg/');

    this.gpgmeInstance = new gpgme();
  }
  generateKeyParams(): string {
    let keyGenParams = fs.readFileSync(path.resolve('./gpg/gpgkeyparams.txt'), 'utf8');

    keyGenParams = keyGenParams.replace('%name%', this.config.configSettings.key.keyConfig.name);
    keyGenParams = keyGenParams.replace('%comment%', this.config.configSettings.key.keyConfig.comment);
    keyGenParams = keyGenParams.replace('%email%', this.config.configSettings.key.keyConfig.email);
    keyGenParams = keyGenParams.replace('%passphrase%', this.config.configSettings.key.keyConfig.passphrase);

    return keyGenParams;
  }
  async deleteKey(keyFingerprint): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.gpgmeInstance.deleteKey(keyFingerprint,
        this.config.configSettings.key.keyConfig.passphrase, (result) => {
        if (result) {
          resolve();
        } else {
          reject();
        }
        });
    });
  }
  async listKeys(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gpgmeInstance.listKeys(this.config.configSettings.key.keyConfig.email, (result) => {
        if (typeof result === 'object') {
          resolve(result);
        } else {
          reject();
        }
      });
    });
  }
  async createKeys() {
    if (!await this.keyExist()) {
      return new Promise((resolve, reject) => {
        this.gpgmeInstance.generateKeys(this.generateKeyParams(), (result) => {
          if (typeof result === 'object') {
            resolve(result);
          } else {
            reject();
          }
        });
      });
    }

    return Promise.resolve();
/*
    const exportedKey = this.exportKey();
    if (typeof exportedKey !== 'undefined') {
      // const publicKey = this.gpgmeInstance.exportKey(key.fingerprint);
      console.log();
    }*/
/*
    if (!this.keyExist()) {
      this.gpgmeInstance.generateKeys(this.generateKeyParams());
    }*/
  }
  async exportKey(): Promise<boolean | {}> {
    const key = await this.getOldestKey();
    if (typeof key !== 'undefined') {
      return new Promise((resolve, reject) => {
        this.gpgmeInstance.exportKey(key.fingerprint, (result) => {
          if (typeof result === 'string' &&
            result.length > 0) {
            resolve(true);
          } else {
            reject(false);
          }
        });
      });
    }

    return Promise.resolve(false);
  }
  async signDetached(imageFileName, signatureFileName) {
    const key = await this.getOldestKey();
    if (typeof key !== 'undefined') {
      return new Promise((resolve, reject) => {
        this.gpgmeInstance.createDetachedSignature(key.fingerprint, 'abc', imageFileName, signatureFileName, (result) => {
          if (typeof result === 'string' &&
            result.length > 0) {
            resolve(true);
          } else {
            reject(false);
          }
        });
      });
    }

    return Promise.resolve(false);
  }
  async getOldestKey(): Promise<any> {
    const keys = await this.listKeys();
    let oldestDate = moment(Date.now());
    let oldestKey = null;
    keys.forEach((key) => {
      const date = moment(new Date(parseInt(key.timestamp, 10) * 1000));
      if (key.email === this.config.configSettings.key.keyConfig.email &&
        oldestDate.isAfter(date)) {
        oldestDate = date;
        oldestKey = key;
      }
    });

    if (oldestKey !== null) {
      return oldestKey;
    }
  }
  async keyExist(): Promise<boolean> {
    const keys = await this.listKeys();
    return keys.length > 0;
  }
}
