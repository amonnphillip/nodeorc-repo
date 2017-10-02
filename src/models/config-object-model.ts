export class ConfigObject {
  public readonly path: string;
  public readonly server: {
    readonly port: string,
  };
  public readonly key: {
    readonly privateKeyName: string,
    readonly publicKeyName: string,
  };
  public readonly  git: {
    readonly author: string,
    readonly email: string,
    readonly repositoryPath: string,
  }
}
