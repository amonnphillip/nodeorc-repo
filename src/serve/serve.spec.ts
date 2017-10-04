import chai = require('chai');
import { RepoManage } from '../repo-manage/repo-manage';
import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Serve } from './serve';

const expect = chai.expect;
const config = new Config('unittest');
const repoManage = new RepoManage(config);

describe('Serve tests', () => {
  before(async () => {
    if (!await repoManage.checkRepoExsist()) {
      await repoManage.createRepo();
    }

    await repoManage.openRepo();
    if (!await repoManage.fileExist('testfile.txt')) {
      const fileBlob = await fs.readFileSync('./test/testfile.txt');
      await repoManage.addFile('testfile.txt', fileBlob);
    }
  });

  after(async () => {
  });

  describe('Test server creation features', () => {
    it('Should be able to create a server', async () => {
      const serve = new Serve(config, repoManage);
      await serve.start();
    });
  });
});
