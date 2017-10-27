import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as moment from 'moment';

const gpgme = require('../../gpgme/build/Debug/gpgme.node');

export class Gpg {
  private gpgmeInstance: any;
  constructor(private config: Config) {
    let gpgPath = '';
    if (this.config.configSettings.key.keyConfig.homedir !== '') {
      gpgPath = path.resolve(this.config.configSettings.key.keyConfig.homedir);
      fs.ensureDirSync(gpgPath);
      fs.chmodSync(gpgPath, '700');
    }
    this.gpgmeInstance = new gpgme(gpgPath);
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
  async createKeys(): Promise<any> {
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
        this.gpgmeInstance.createDetachedSignature(key.fingerprint,
          this.config.configSettings.key.keyConfig.passphrase,
          imageFileName,
          signatureFileName, (result) => {
          if (result) {
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
