import { Serve} from './serve/serve';
import { Config } from './config/config';
import { RepoManage } from './repo-manage/repo-manage';

const configInstance = new Config('debug');
const repoInstance = new RepoManage(configInstance);
const serveInstance = new Serve(configInstance, repoInstance);

serveInstance.start().then(() => {
  console.log('Server started');
}).catch((err) => {
  console.log(`Server error: ${err}`);
});
