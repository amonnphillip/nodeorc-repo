import chai = require('chai');
import { RepoManage } from './repo-manage';
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
    const repoManage = new RepoManage(config);
  });

  describe('Test repository creation features', () => {
    before(async () => {
    });

    after(async () => {
      await deleteRepo();
    });

    it('Should be able to check if a repository is not present', async () => {
      await deleteRepo();
      const repoManage = new RepoManage(config);
      await repoManage.checkRepoExsist().then((ret) => {
        expect(ret).to.equal(false);
      }).catch((err) => {
        throw new Error(err);
      });
    });

    it('Should be able to create a repository', async () => {
      await deleteRepo();
      const repoManage = new RepoManage(config);
      await repoManage.createRepo().then(() => {
        // Nothing to do here
      }).catch((err) => {
        throw Error(err);
      });
    });

    it('Should be able to get a valid repository path', async () => {
      await deleteRepo();
      const repoManage = new RepoManage(config);
      await repoManage.createRepo().then(() => {
        expect(repoManage.repositoryPath).to.exist;
      }).catch((err) => {
        throw Error(err);
      });
    });

    it('Should be able to open a repository', async () => {
      await deleteRepo();
      const repoManage = new RepoManage(config);
      await repoManage.createRepo().then((ret) => {
        return repoManage.openRepo();
      }).then(() => {
        // Nothing to do here
      }).catch((err) => {
        throw new Error(err);
      });
    });
  });

  describe('Test repository file features', () => {
    before(async () => {
      const repoManage = new RepoManage(config);
      if (!await repoManage.checkRepoExsist()) {
        await repoManage.createRepo();
      }
    });

    after(async () => {
      await deleteRepo();
    });

    it('Should be able to add a file to the repo', async () => {
      const fileBlob = await fs.readFileSync('./test/testfile.txt');

      const repoManage = new RepoManage(config);
      await repoManage.openRepo();
      const commitId = await repoManage.addFile('testfile.txt', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
    });

    it('Should be able to check if a file exists in a repo', async () => {
      const fileBlob = await fs.readFileSync('./test/testfile.txt');

      const repoManage = new RepoManage(config);
      await repoManage.openRepo();
      const commitId = await repoManage.addFile('testfile.txt', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);

      let fileExsists = await repoManage.fileExist('testfile.txt');
      expect(fileExsists).to.equal(true);
      fileExsists = await repoManage.fileExist('testfile_does_not_exist.txt');
      expect(fileExsists).to.equal(false);
    });

    it('Should be able to do a file search in the repo', async () => {
      const fileBlob = await fs.readFileSync('./test/testfile.txt');

      const repoManage = new RepoManage(config);
      await repoManage.openRepo();
      let commitId = await repoManage.addFile('testfile.aci', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('testfile.aci.asc', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('testfile2.aci', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('testfile2.aci.asc', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('./somedir/testfile2.aci', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('./somedir/testfile2.aci.asc', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('zztestfile3.aci', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);
      commitId = await repoManage.addFile('zztestfile3.aci.asc', fileBlob);
      expect(commitId).to.exist;
      expect(commitId.toString().length).to.be.greaterThan(1);

      let files = await repoManage.findFiles('**/testfile*.aci');
      expect(files.length).to.equal(3);

      files = await repoManage.findFiles('**/testfile*.aci.asc');
      expect(files.length).to.equal(3);

      files = await repoManage.findFiles('**/somedir/testfile2.aci');
      expect(files.length).to.equal(1);

      files = await repoManage.findFiles('testfile_does_not_exist');
      expect(files.length).to.equal(0);
    });

    it('Should be able to get a file from the repo', async () => {
      const repoManage = new RepoManage(config);
      await repoManage.openRepo();

      const fileBlob = await repoManage.getFile('testfile.txt');
      expect(fileBlob).to.exist;
      expect(fileBlob.length).to.equal(15);
    });
  });
});
