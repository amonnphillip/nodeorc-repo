export class ConfigObject {
  public readonly path: string;
  public readonly server: {
    readonly protocol: string,
    readonly port: string,
    readonly key: string,
    readonly cert: string,
  };
  public readonly metaData: {
    readonly protocol: string,
  };
  public readonly key: {
    readonly privateKeyName: string,
    readonly publicKeyName: string,
    readonly keyConfig: {
      readonly name: string,
      readonly comment: string,
      readonly email: string,
      readonly passphrase: string,
    }
  };
  public readonly  git: {
    readonly author: string,
    readonly email: string,
    readonly repositoryPath: string,
  };
}
