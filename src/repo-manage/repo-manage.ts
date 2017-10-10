import { Config } from '../config/config';
import * as Git from 'nodegit';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as recursive from 'recursive-readdir';
import * as matcher from 'is-match';
import { RepoFileCommitModel } from '../models/repo-file-commit-model';

export interface IRepoManageInterface {
  readonly repositoryPath: string;
  checkRepoExsist(): Promise<any>;
  openRepo(): Promise<any>;
  createRepo(): Promise<any>;
  getFile(fileNameAndPath): Promise<any>;
  addFile(fileNameAndPath, fileBlob): Promise<any>;
  fileExist(fileNameAndPath): Promise<boolean|{}>;
  findFiles(fileGlobPattern): Promise<string[]|any>;
  getMostRecentFileCommits(): Promise<RepoFileCommitModel[]>;
}

export class RepoManage implements IRepoManageInterface {
  private static readonly gitCommitMessage = 'NodeOrc repo auto commit';
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
    await this.repo.createCommit('HEAD', author, committer, RepoManage.gitCommitMessage, oidResult, []);
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

    // Make sure file directories exist
    const resolvedFileName = path.resolve(this.repositoryPath + '/' + fileNameAndPath);
    const basePath = path.parse(resolvedFileName).dir;
    if (basePath !== '') {
      fs.ensureDir(basePath);
    }

    // Clean up relative path for file because nodeGit it picky
    let cleanedUpFileNameAndPath = path.relative(this.repositoryPath, resolvedFileName);
    cleanedUpFileNameAndPath = cleanedUpFileNameAndPath.split('\\').join('/');

    // Add file to git repo
    await fs.writeFile(resolvedFileName, fileBlob);
    const index = await this.repo.refreshIndex();
    await index.addByPath(cleanedUpFileNameAndPath);
    await index.write();
    const oidResult = await index.writeTree();
    const head = await Git.Reference.nameToId(this.repo, 'HEAD');
    const parent = await this.repo.getCommit(head);
    const author = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    const committer = await Git.Signature.now(this.config.configSettings.git.author, this.config.configSettings.git.email);
    return await this.repo.createCommit('HEAD', author, committer,
      RepoManage.gitCommitMessage + ' ' + path.parse(resolvedFileName).base, oidResult, [parent]);
  }
  async fileExist(fileNameAndPath): Promise<boolean|{}> {
    assert(this.repo);

    const resolvedFileName = path.resolve(this.repositoryPath + '/' + fileNameAndPath);
    return new Promise((resolve, reject) => {
      fs.exists(resolvedFileName, (exists) => {
        resolve(exists);
      });
    });
  }
  async findFiles(fileGlobPattern): Promise<string[]|any> {
    assert(this.repo);

    const isMatch = matcher(fileGlobPattern);

    return new Promise((resolve, reject) => {
      recursive(this.repositoryPath, [(file, stats) => {
        // Ignore the .git dir and search the other directories for the file in question
        if (file === path.resolve(this.repositoryPath + '/.git')) {
          return true;
        } else if (stats.isDirectory()) {
          return false;
        } else {
          const posixStyle = file.split('\\').join('/');
          const r = isMatch(posixStyle);
          return !r;
        }
      }], (err, files) => {
        if (err === null) {
          resolve(files);
        } else {
          reject(err);
        }
      });
    });
  }
  async getMostRecentFileCommits(): Promise<RepoFileCommitModel[]> {
    assert(this.repo);

    const containerEntries = [];

    const masterCommit = await this.repo.getMasterCommit();
    const index = await this.repo.refreshIndex();
    const entries = await index.entries();

    const walker = this.repo.createRevWalk();
    walker.push(masterCommit.sha());
    walker.sorting(Git.Revwalk.SORT.Time);

    const entriesToGetHistoryFor = [];
    const remainingEntries = [];
    for (const ent of entries) {
      if (ent.path.endsWith('.aci')) {
        entriesToGetHistoryFor.push(ent);
        remainingEntries.push(ent.path);
      }
    }

    let done = false;
    do {
      const oid = await walker.next();
      if (oid) {
        const commit = await walker.repo.getCommit(oid);
        const diffs = await commit.getDiff();
        for (const dif of diffs) {
          const patches = await dif.patches();
          for (const patch of patches) {
            const file = patch.newFile().path();
            for (const ent of remainingEntries) {
              const foundIndex = remainingEntries.indexOf(file);
              if (foundIndex > -1) {
                containerEntries.push(new RepoFileCommitModel({
                  path: file,
                  committer: commit.committer().name(),
                  date: commit.date().toString(),
                  message: commit.message(),
                  added: patch.isAdded(),
                  modified: patch.isModified(),
                  hash: commit.sha(),
                }));
                remainingEntries.splice(foundIndex, 1);
                break;
              }
            }
          }
        }
      } else {
        done = true;
      }

      if (remainingEntries.length === 0) {
        done = true;
      }
    } while (!done);

    return containerEntries;
  }
  async getRepoState(): Promise<any> {

  }
}
