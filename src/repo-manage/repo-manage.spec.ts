import chai = require('chai');
import { ReopManage } from './repo-manage';
import { Config } from '../config/config';
import * as fs from 'fs-extra';
import * as path from 'path';

const expect = chai.expect;
const config = new Config('unittest');

const deleteRepo = async () => {
  const repoPath = path.resolve(config.configSettings.path + config.configSettings.git.repositoryPath);
  if (!path.isAbsolute(repoPath) ||
    repoPath.length < 3 ||
    repoPath === '/') {
    throw new Error('Error in git config path');
  }
  await fs.ensureDir(repoPath);
  await fs.emptyDir(repoPath);
};

describe('ReopManage tests', () => {
  it('Should be able to initialise a ReopManage object', () => {
    const reopManage = new ReopManage(config);
  });

  describe('Test repository creation features', () => {
    before(async () => {
    });

    after(async () => {
      await deleteRepo();
    });

    it('Should be able to check if a repository is not present', async () => {
      await deleteRepo();
      const reopManage = new ReopManage(config);
      await reopManage.checkRepoExsist().then((ret) => {
        expect(ret).to.equal(false);
      }).catch((err) => {
        throw new Error(err);
      });
    });

    it('Should be able to create a repository', async () => {
      await deleteRepo();
      const reopManage = new ReopManage(config);
      await reopManage.createRepo().then(() => {
        // Nothing to do here
      }).catch((err) => {
        throw Error(err);
      });
    });

    it('Should be able to open a repository', async () => {
      await deleteRepo();
      const reopManage = new ReopManage(config);
      await reopManage.createRepo().then((ret) => {
        return reopManage.openRepo();
      }).then(() => {
        // Nothing to do here
      }).catch((err) => {
        throw new Error(err);
      });
    });
  });

  describe('Test repository file features', () => {
    before(async () => {
      const reopManage = new ReopManage(config);
      if (!await reopManage.checkRepoExsist()) {
        await reopManage.createRepo();
      }
    });

    after(async () => {
      await deleteRepo();
    });

    it('Should be able to add a file to the repo', async () => {
      const fileBlob = await fs.readFileSync('./test/testfile.txt');

      const reopManage = new ReopManage(config);
      await reopManage.openRepo();
      const commitId = await reopManage.addFile('testfile.txt', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
    });

    it('Should be able to get a file from the repo', async () => {
      const reopManage = new ReopManage(config);
      await reopManage.openRepo();

      const fileBlob = await reopManage.getFile('testfile.txt');
      expect(fileBlob).to.exist;
      expect(fileBlob.length).to.equal(15);
    });
  });
});
