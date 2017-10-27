/* eslint-disable no-unused-expressions */

import chai = require('chai');
import { Gpg } from './gpg';
import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';
import * as os from 'os';

const expect = chai.expect;
const config = new Config('unittest');

const getKeysViaCommandLine = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let error = false;

    const child = child_process.spawn('gpg2', ['--list-keys', '--homedir',
      path.resolve(config.configSettings.key.keyConfig.homedir),
      '--fingerprint', config.configSettings.key.keyConfig.email]);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      if (data.toString().indexOf('No public key') >= 0) {
        error = true;
      }
    });

    child.on('close', (code) => {
      const matches = [];

      if (!error) {
        const regex = new RegExp('(Key fingerprint =)(.+)', 'gi');
        const fingerPrints = stdout.match(regex);
        if (fingerPrints) {
          fingerPrints.forEach((frag) => {
            matches.push(frag.replace('Key fingerprint = ', '').split(' ').join(''));
          });
        }
      }

      resolve(matches);

    });
  });
};

const removeKeyViaCommandLine = async (fingerprint): Promise<any> => {
  return new Promise((resolve, reject) => {
    let error = false;

    const child = child_process.spawn('gpg2',
      ['--batch', '--yes',
        '--delete-secret-and-public-keys', '--homedir', path.resolve(config.configSettings.key.keyConfig.homedir),
        '--passphrase', config.configSettings.key.keyConfig.passphrase, fingerprint]);

    child.stderr.on('data', (data) => {
      error = true;
    });

    child.on('close', (code) => {
      if (!error) {
        reject();
      } else {
        resolve();
      }
    });
  });
};

const removeAllKeysViaCommandLine = async () => {
  const keys = await getKeysViaCommandLine();

  const promises = [];
  keys.forEach((key) => {
    promises.push(removeKeyViaCommandLine(key));
  });

  await Promise.all(promises);
};

describe('Gpg module tests', () => {
  before(async () => {
    await removeAllKeysViaCommandLine();
  });

  it('Should be able to generate keys', async () => {
    const newGpg = new Gpg(config);

    const result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;
    expect(result.fingerprint.length).to.equal(40);
    expect(result.primaryGenerated).to.exist;
    expect(result.subKeyGenerated).to.exist;

    await removeKeyViaCommandLine(result.fingerprint);
  });

  it('Should be able to list keys', async () => {
    await removeAllKeysViaCommandLine();

    const newGpg = new Gpg(config);

    let keys = await newGpg.listKeys();
    expect(keys).to.exist;
    expect(keys.length).to.equal(0);

    const result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;

    keys = await newGpg.listKeys();
    expect(keys).to.exist;
    expect(keys.length).to.equal(1);
  });

  it('Should be able to check if a key exists', async () => {
    await removeAllKeysViaCommandLine();

    const newGpg = new Gpg(config);

    let success = await newGpg.keyExist();
    expect(success).to.equal(false);

    const result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;

    success = await newGpg.keyExist();
    expect(success).to.equal(true);
  });

  it('Should be able to get the oldest key', async () => {
    await removeAllKeysViaCommandLine();

    const newGpg = new Gpg(config);

    let result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;

    result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;

    const key = await newGpg.getOldestKey();
    expect(key).to.equal(true);
  });

  it('Should be able to create a signature for a file', async () => {
    fs.ensureDirSync(path.resolve(os.homedir() + '/unittestfiles'));
    fs.chmodSync(path.resolve(os.homedir() + '/unittestfiles'), '777');
    const filePathAndName = os.homedir() + '/unittestfiles/testfile.txt.sig';

    await removeAllKeysViaCommandLine();

    const newGpg = new Gpg(config);

    const result = await newGpg.createKeys();
    expect(result).to.exist;
    expect(result.fingerprint).to.exist;

    const success = await newGpg.signDetached(
      path.resolve('./test/testfile.txt'),
      filePathAndName);
    expect(success).to.equal(true);
    const exists = fs.existsSync(filePathAndName);
    expect(exists).to.equal(true);
  });
});
