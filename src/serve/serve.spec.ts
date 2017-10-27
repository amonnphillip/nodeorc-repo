import chai = require('chai');
import { RepoManageMoc } from './repo-manage-serve-moc';
import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Serve } from './serve';
import { Gpg } from '../gpg/gpg';

const expect = chai.expect;
const config = new Config('unittest');
const repoManageMoc = new RepoManageMoc(config);
const gpg = new Gpg(config);

describe('Serve tests', () => {
  before(async () => {
  });

  after(async () => {
  });

  describe('Test server creation features', () => {
    it('Should be able to create a server', async () => {
      const serve = new Serve(config, repoManageMoc, gpg);
      await serve.start();
    });

    it('Should be able to create metadata', async () => {
      const serve = new Serve(config, repoManageMoc, gpg);
      await serve.start();
      const response = await serve.createMeta('example', '', ''); // TODO: FIX THIS!
      expect(response).to.exist;

      const responseData = fs.readFileSync(__dirname + '/testdata/server-metadata-response.txt', 'utf8');
      expect(response.html).to.equal(responseData);
    });
  });

  it('Should be able to find a requested file', async () => {
    const serve = new Serve(config, repoManageMoc, gpg);
    await serve.start();
    let response = await serve.findRequestedFile('example-0.0.1-linux-amd64.aci');
    expect(response).to.exist;
    response = response.split('\\').join('/');
    expect(response).to.equal('F:/work/nodeorc-repo-test/nodeorcrepo/somedir/somedir2/example-0.0.1-linux-amd64.aci');
  });
});
