import { Config } from '../config/config';
import * as Git from 'nodegit';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';

export class RepoManage {
  readonly repositoryPath: string;
  private repo: any;
  constructor(private config: Config) {
    this.repositoryPath = path.resolve(this.config.configSettings.path + this.config.configSettings.git.repositoryPath);
    this.repo = null;
  }
  async checkRepoExsist(): Promise<any> {
    return new Promise((resolve, reject) => {
      const repo = Git.Repository.open(this.repositoryPath).then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  }
  async openRepo(): Promise<any> {
    return new Promise((resolve, reject) => {
      Git.Repository.open(this.repositoryPath).then((repo) => {
        this.repo = repo;
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }
  async createRepo(): Promise<any> {
    this.repo = await Git.Repository.init(this.repositoryPath, 0);
    const index = await this.repo.refreshIndex();
    const oidResult = await index.writeTree();
    const author = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    const committer = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    await this.repo.createCommit('HEAD', author, committer, 'auto commit', oidResult, []);
  }
  async getFile(fileNameAndPath): Promise<any> {
    assert(this.repo);

    const resolvedFileName = path.resolve(this.repositoryPath + '/' + fileNameAndPath);
    return new Promise((resolve, reject) => {
      if (fs.existsSync(resolvedFileName)) {
        fs.readFile(resolvedFileName, (err, data) => {
          if (err === null) {
            resolve(data);
          } else {
            reject('Error reading file');
          }
        });
      } else {
        reject('File does not exist');
      }
    });
  }
  async addFile(fileNameAndPath, fileBlob): Promise<any> {
    assert(this.repo);

    const resolvedFileName = path.resolve(this.repositoryPath + '/' + fileNameAndPath);
    await fs.writeFile(resolvedFileName, fileBlob);
    const index = await this.repo.refreshIndex();
    await index.addByPath(fileNameAndPath);
    await index.write();
    const oidResult = await index.writeTree();
    const head = await Git.Reference.nameToId(this.repo, 'HEAD');
    const parent = await this.repo.getCommit(head);
    const author = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    const committer = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    return await this.repo.createCommit('HEAD', author, committer, 'nodeorc auto commit', oidResult, [parent]);
  }
  async fileExist(fileNameAndPath): Promise<boolean|{}> {
    const resolvedFileName = path.resolve(this.repositoryPath + '/' + fileNameAndPath);
    return new Promise((resolve, reject) => {
      fs.exists(resolvedFileName, (exists) => {
        resolve(exists);
      });
    });
  }
}
