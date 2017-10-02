import chai = require('chai');
import { Config } from '../config/config';
import { Keys } from './keys';
import * as fs from 'fs';
import * as path from 'path';

const expect = chai.expect;
const config = new Config('unittest');

describe('Config module', () => {
  it('Should be able to initialise a keys object', () => {
    const keys = new Keys(config);
    expect(keys).to.not.be.undefined;
  });

  it('Should be able to generate keys at the path specified in the config', (done) => {
    const keys = new Keys(config);
    keys.generateKeys().then(() => {
      // Check keys are where they should be
      const privatePath = path.resolve(config.configSettings.path + config.configSettings.key.privateKeyName);
      const publicPath = path.resolve(config.configSettings.path + config.configSettings.key.publicKeyName);
      if (fs.existsSync(privatePath) &&
        fs.existsSync(publicPath)) {
        done();
      } else {
        throw new Error('Keys not found in expected location');
      }
    }).catch((err) => {
      throw new Error(err);
    });
  });
});
