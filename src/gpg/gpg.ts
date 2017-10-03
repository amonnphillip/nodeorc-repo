import { Config } from '../config/config';
import * as Crypto2 from 'crypto2';
import * as fs from 'fs';
import * as path from 'path';
import * as GpgLib from 'gpg';
import * as childProcess from 'child_process';

export class Gpg {
  private gpgUser: 'NodeOrc';
  private destinationPath: string;
  constructor(private config: Config) {
    this.destinationPath = path.resolve('./gpg/');
  }
  async createKeys(): Promise<any> {
    const file = path.resolve('./gpg/gpggen.txt');

    const key = await this.execGpg(['--batch', '--generate-key', file], this.destinationPath);
    return key;
  }
  async execGpg(args: string[], destinationPath: string): Promise<any> {
    const options = {
      cwd: destinationPath,
      shell: true,
    };

    return new Promise((resolve, reject) => {
      const g = childProcess.spawn('gpg', args, options);

      g.stdout.on('data', (data) => {
        console.log(`${data}`);
      });

      g.stderr.on('data', (data) => {
        console.log(`${data}`);
        reject(new Error(data.toString()));
      });

      g.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`GPG key creation error: ${code}`));
        }
      });
    });
  }
  async keyExist(): Promise<any> {
    const options = {
      cwd: this.destinationPath,
      shell: true,
    };

    return new Promise((resolve, reject) => {
      const g = childProcess.spawn('gpg', ['-k', this.gpgUser], options);

      g.stdout.on('data', (data) => {
        console.log(`${data}`);

        const out = data.toString();
        if (out.length === 0) {
          reject();
        } else {
          const frags = out.split('\r\n');
        }
      });

      g.stderr.on('data', (data) => {
        console.log(`${data}`);
        reject(new Error(data.toString()));
      });

      g.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`GPG key list error: ${code}`));
        }
      });
    });
  }
}
