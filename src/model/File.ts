import { Fields$ContentVersion } from './smoothstack.schema';

export interface FileUpload {
  type: string;
  contentType: string;
  fileContent: string;
  name: string;
}

export interface SFDCFile extends Fields$ContentVersion {
  VersionData_Base64: string;
}
