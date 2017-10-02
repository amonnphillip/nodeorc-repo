import { Serve} from './serve/serve';
import { Config } from './config/config';

const configInstance = new Config('debug');
const serveInstance = new Serve();
serveInstance.start();
