import { Serve} from './serve/serve';
import { Config } from './config/config';
import { RepoManage } from './repo-manage/repo-manage';
import { Gpg } from './gpg/gpg';

const configInstance = new Config('debug');
const repoInstance = new RepoManage(configInstance);
const gpgInstance = new Gpg(configInstance);
const serveInstance = new Serve(configInstance, repoInstance, gpgInstance);

serveInstance.start().then(() => {
  console.log('Server started');
}).catch((err) => {
  console.log(`Server error: ${err}`);
});
