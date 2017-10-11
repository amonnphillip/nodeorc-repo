import { Config } from '../config/config';
import { IRepoManageInterface } from '../repo-manage/repo-manage';
import { RepoFileCommitModel } from '../models/repo-file-commit-model';
import * as fs from 'fs-extra';
import * as path from 'path';

export class RepoManageMoc implements IRepoManageInterface {
  readonly repositoryPath: string;
  constructor(private config: Config) {
    this.repositoryPath = path.resolve(this.config.configSettings.path + this.config.configSettings.git.repositoryPath);
  }
  checkRepoExsist(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  openRepo(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  createRepo(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  getFile(fileNameAndPath): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  addFile(fileNameAndPath, fileBlob): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  addExistingFile(fileNameAndPath): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  fileExist(fileNameAndPath): Promise<boolean|{}> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  async findFiles(fileGlobPattern): Promise<string[]|any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fileGlobPattern === 'example*.aci') {
          resolve([
            path.normalize(this.repositoryPath + '/somedir/somedir2/example.aci'),
            path.normalize(this.repositoryPath + '/somedir/somedir2/example2.aci'),
            path.normalize(this.repositoryPath + '/somedir/example3.aci'),
            path.normalize(this.repositoryPath + '/somedir/example4.aci'),
            path.normalize(this.repositoryPath + '/example5.aci'),
          ]);
        } else if (fileGlobPattern === '**/example-0.0.1-linux-amd64.aci') {
          resolve([
            path.normalize(this.repositoryPath + '/somedir/somedir2/example-0.0.1-linux-amd64.aci'),
          ]);
        } else if (fileGlobPattern === '*.gpg') {
          resolve([
            path.normalize(this.repositoryPath + '/pubkey.gpg'),
          ]);
        } else {
          reject();
        }
      });
    });
  }
  async getMostRecentFileCommits(): Promise<RepoFileCommitModel[]> {
    return [];
  }
}
