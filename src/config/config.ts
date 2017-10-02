import * as fs from 'fs';
import * as path from 'path';
import { ConfigObject } from '../models/config-object-model';

export class Config {
  readonly configSettings: ConfigObject;
  constructor(configName: string) {
    const configPathAndName = path.resolve('./config/config-' + configName + '.json');
    const config = fs.readFileSync(configPathAndName, 'utf8');
    this.configSettings = JSON.parse(config);
  }
}
