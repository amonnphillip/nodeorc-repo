import chai = require('chai');
import { Config } from './config';

const expect = chai.expect;

describe('Config module', () => {
  it('Should be able to initialise a config object', () => {
    const newConfig = new Config('unittest');
    // TODO: FILL THIS IN!
    expect(newConfig.configSettings.server.port).to.equal(4001);
  });
});
