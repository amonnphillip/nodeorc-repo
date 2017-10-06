import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as  fileUpload from 'express-fileupload';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as util from 'util';
import { Config } from '../config/config';
import { IRepoManageInterface } from '../repo-manage/repo-manage';
import { MetadataResponse, MetadataResponseError } from '../models/metadata-response-model';

const readFile = util.promisify(fs.readFile);

export class Serve {
  private app: any;
  constructor(private config: Config, private repoManage: IRepoManageInterface) {
    this.app = express();
  }
  async start(): Promise<any> {
    if (!await this.repoManage.checkRepoExsist()) {
      await this.repoManage.createRepo();
    }
    await this.repoManage.openRepo();

    return new Promise((resolve, reject) => {
      this.app.use(express.static(this.repoManage.repositoryPath));
      const corsOptions = {
        origin: ['http://localhost:4001', 'http://localhost:4200'],
      };
      this.app.use(cors(corsOptions));
      this.app.use(fileUpload());
      this.app.use(helmet()); // TODO: THIS TOOL IS SUPPOSED TO BE USED INTERNALLY ONLY? IF SO WE DO NOT NEED THIS??
      this.app.use(bodyParser.json());
      this.app.use(bodyParser.urlencoded({
        extended: true,
      }));
      this.app.get('/', (req, res) => {
        res.send('Hello from NodeOrc repo!');
      });
      this.app.get('/uploadui', async (req, res) => {
        const html = await readFile(path.resolve('./html/uploadui.html'), 'utf8');

        res.type('html');
        res.send(html);
        res.status(200).end();
      });
      this.app.post('/fileexists', async (req, res) => {
        // TODO: VALIDATE FILE NAME

        const files = await this.repoManage.findFiles('**/' + req.body.fileName);
        if (files &&
          files.length > 0) {
          res.status(200).end();
        } else {
          res.status(404).end();
        }
      });
      this.app.post('/uploadfile', async (req, res) => {
        // TODO: SECURE THIS API!

        if (req.files) {
          // TODO: VALIDATE FILE NAME, LENGTH AND LOCATION

          try {
            const commitId = this.repoManage.addFile( 'images/' + req.files.imagefile.name, req.files.imagefile.data);
          } catch (err) {
            res.status(500).end();
          }
        } else {
          res.status(400).end();
        }
      });
      this.app.get('/:requestName', async (req, res) => {
        if (req.query['ac-discovery'] === 1 ) {
          // AC discovery request
          const metadataResponse = await this.createMeta(req.params.requestName);
          switch (metadataResponse.error) {
            case MetadataResponseError.NoError:
              res.type('html');
              res.send(metadataResponse.html);
              res.status(200).end();
              break;
            case MetadataResponseError.ImageNameNotFound:
              res.type('html');
              res.send(metadataResponse.html);
              res.status(404).end();
              break;
            default:
              res.status(500).end();
              break;
          }
        } else if (req.params.requestName.endsWith('.gpg') ||
          req.params.requestName.endsWith('.asc') ||
          req.params.requestName.endsWith('.aci')) {
          // Image type request
          const fileNameAndPath = await this.findRequestedFile(req.params.requestName);
          if (fileNameAndPath) {
            const options = {
              cacheControl: false,
            };
            res.sendFile(fileNameAndPath, options);
          } else {
            res.status(404).end();
          }
        } else {
          // Unknown request
          res.status(404).end();
        }
      });
      this.app.listen(this.config.configSettings.server.port, () => {
        resolve();
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
  async createMeta(imageName): Promise<MetadataResponse> {
    // TODO: FOR SECURITY CHECK THE LENGTH OF THE IMAGE NAME

    try {
      const files = await this.repoManage.findFiles('**/' + imageName + '*.aci');
      const pubKey = await this.repoManage.findFiles('**/*.gpg');
      if (files.length > 0 &&
        pubKey.length > 0) {

        // Images found so process a valid metadata response
        let html = await readFile(path.resolve('./html/metadiscovery.html'), 'utf8');
        const url = new URL(this.config.configSettings.metaData.registryUrl + '/');

        let imagePath = path.parse(files[0]).dir.replace(this.repoManage.repositoryPath, '');
        imagePath = imagePath.replace(new RegExp(/\\/, 'g'), '/');
        if (imagePath[0] === '/') {
          imagePath = imagePath.substr(1);
        }

        html = html.replace(new RegExp('{{registryurl}}', 'g'), url.host);
        html = html.replace(new RegExp('{{imagename}}', 'g'), imageName);
        html = html.replace(new RegExp('{{registryprotocol}}', 'g'), url.protocol);
        html = html.replace(new RegExp('{{imagedirectory}}', 'g'), imagePath);
        html = html.replace(new RegExp('{{publickeyfilename}}', 'g'), path.parse(pubKey[0]).base);

        return new MetadataResponse(html, MetadataResponseError.NoError);
      } else {

        // No images found
        const html = await readFile(path.resolve('./html/nometadata.html'));
        return new MetadataResponse(html, MetadataResponseError.ImageNameNotFound);
      }
    } catch (err) {
      // TODO: LOG ERROR
      return new MetadataResponse('', MetadataResponseError.CriticalError);
    }
  }
  async findRequestedFile(fileName): Promise<any> {
    // TODO: WHAT HAPPENS IF WE HAVE MULTIPLE FILES?

    const files = await this.repoManage.findFiles('**/' + fileName);
    if (files.length > 0) {
      return files[0];
    }
  }
}
