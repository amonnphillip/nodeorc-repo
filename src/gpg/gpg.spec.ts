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

    // const success = await newGpg.createKeys();
    await newGpg.signDetached('/home/amonn/somefile.txt', '/home/amonn/somefile.txt.sig');
    //const d1 = await newGpg.deleteKey('DE4C3BADC163E61072E9B53CD86EAD86E472DD9E');
    //const d2 = newGpg.deleteKey('4661995C2A727D1274A3DBD4DAE5747BE82D8C91');
    //const d3 = newGpg.deleteKey('crap');
    //const d4 = newGpg.deleteKey('crap4');
    //await Promise.all([d1, d2, d3, d4]);

//    const success = await newGpg.createKeys();
//    expect(success).to.equal(true);
  });
/*
  it('Should be able to check if a key exists', async () => {
    const newGpg = new Gpg(config);
    const success = await newGpg.keyExist();
    expect(success).to.equal(true);
  });*/
});
