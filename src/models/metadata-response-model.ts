export enum MetadataResponseError {
  NoError,
  ImageNameNotFound,
  CriticalError,
}

export class MetadataResponse {
  public readonly html: string;
  public readonly error: MetadataResponseError;
  constructor(html: string, error: MetadataResponseError) {
    this.html = html;
    this.error = error;
  }
}
