import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as path from 'path';
import { Config } from '../config/config';
import { RepoManage } from '../repo-manage/repo-manage';

export class Serve {
  private app: any;
  constructor(private config: Config, private repoManage: RepoManage) {
    this.app = express();
  }
  async start(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.app.use(express.static(this.repoManage.repositoryPath));
      this.app.use(bodyParser.json());
      this.app.use(bodyParser.urlencoded({
        extended: true,
      }));
      this.app.get('/', (req, res) => {
        res.send('Hello from NodeGit!');
      });
      this.app.listen(this.config.configSettings.server.port, () => {
        resolve();
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
}
