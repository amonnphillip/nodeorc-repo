import { Config } from '../config/config';
import * as Crypto2 from 'crypto2';
import * as fs from 'fs';
import * as path from 'path';

export class Keys {
  constructor(private config: Config) {
    console.log();
  }
  checkKeys(): boolean {
    const privatePath = path.resolve(this.config.configSettings.path + this.config.configSettings.key.privateKeyName);
    const publicPath = path.resolve(this.config.configSettings.path + this.config.configSettings.key.publicKeyName);
    if (fs.existsSync(privatePath) &&
      fs.existsSync(publicPath)) {
      return true;
    } else {
      return false;
    }
  }
  generateKeys() {
    return new Promise((resolve, reject) => {
      Crypto2.createKeyPair((err, privateKey, publicKey) => {
        if (err === null) {
          const privatePath = path.resolve(this.config.configSettings.path + this.config.configSettings.key.privateKeyName);
          const publicPath = path.resolve(this.config.configSettings.path + this.config.configSettings.key.publicKeyName);
          fs.writeFileSync(privatePath, privateKey);
          fs.writeFileSync(publicPath, publicKey);
          resolve();
        } else {
          reject();
        }
      });
    });
  }
}
