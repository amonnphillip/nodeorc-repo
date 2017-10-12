import { Config } from '../config/config';
import * as Crypto2 from 'crypto2';
import * as fs from 'fs';
import * as path from 'path';
import * as GpgLib from 'gpg';
import * as childProcess from 'child_process';
import * as ffi from 'ffi';
import * as ref from 'ref';

const types = {
  REGSAM: ref.types.ulong,
  DWORD: ref.types.uint32,
  ULONG: ref.types.ulong,
  HWND: ref.refType(ref.types.void),
  BYTE: ref.types.uint8,
  HKEY: ref.refType(ref.types.void),
  PVOID: ref.refType('pointer'),
  HANDLE: ref.refType(ref.types.void),
  HINSTANCE: ref.refType(ref.types.void),
  LPCTSTR: ref.refType(ref.types.CString),
  STRING: ref.types.CString,
  INT: ref.types.int,
  LPVOID: ref.refType(ref.types.void),
  PHKEY: null,
  LPBYTE: null,
  LPDWORD: null,
};

types.PHKEY = ref.refType(types.HKEY);
types.LPBYTE = ref.refType(types.BYTE);
types.LPDWORD = ref.refType(types.DWORD);

export class Gpg {
  private gpgUser: 'NodeOrc';
  private destinationPath: string;
  constructor(private config: Config) {
    this.destinationPath = path.resolve('./gpg/');

    const intPtr = ref.refType('int');
    const libm = ffi.Library('F:\\Program Files (x86)\\GnuPG\\bin\\libgpgme-11', {
      gpgme_free: ['void', [types.LPVOID]],
    });

    const err = libm.gpgme_new(intPtr);
    console.log(err);
  }
  async createKeys(): Promise<any> {
    const file = path.resolve('./gpg/gpggen.txt');

    const key = await this.execGpg(['--batch', '--generate-key', file], this.destinationPath);
    return key;
  }
  async signImage(imagePath, imageName) {
    await this.execGpg(
      ['--homedir',
        'E:/gpg',
        '--passphrase',
        'abc',
        '--yes',
        '--output',
        path.resolve(imagePath + '/' + imageName + '.asc'),
        '--detach-sig',
        path.resolve(imagePath + '/' + imageName)],
        path.resolve(imagePath));
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
