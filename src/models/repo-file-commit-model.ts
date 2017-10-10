export class RepoFileCommitModel {
  readonly path: string;
  readonly committer: string;
  readonly date: string;
  readonly message: string;
  readonly added: string;
  readonly modified: string;
  readonly hash: string;
  constructor(obj: any) {
    this.path = obj.path;
    this.committer = obj.committer;
    this.date = obj.date;
    this.message = obj.message;
    this.added = obj.added;
    this.modified = obj.modified;
    this.hash = obj.hash;
  }
}
