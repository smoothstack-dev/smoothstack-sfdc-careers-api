export interface MSUser {
  id: string;
  userPrincipalName: string;
  tempPassword?: string;
  assignedLicenses?: any[];
}

export interface MSDirectoryUser {
  id: string;
  mail: string;
}
