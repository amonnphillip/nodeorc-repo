import chai = require('chai');
import { Gpg } from './gpg';
import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';

const expect = chai.expect;
const config = new Config('unittest');

describe('Gpg module', () => {
  it('Should be able to generate keys', async () => {
    const newGpg = new Gpg(config);

    const success = await newGpg.createKeys();
    expect(success).to.equal(true);
  });
/*
  it('Should be able to check if a key exists', async () => {
    const newGpg = new Gpg(config);
    const success = await newGpg.keyExist();
    expect(success).to.equal(true);
  });*/
});
