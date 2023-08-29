import { BlobString, Connection } from 'jsforce';
import { FileUpload } from '../model/File';
import { Fields$ContentVersion, SmoothstackSchema } from '../model/smoothstack.schema';
// import MemoryStream from 'memorystream';

export const saveSFDCFiles = async (conn: Connection<SmoothstackSchema>, objectID: string, files: FileUpload[]) => {
  for (const file of files) {
    let fileName = file.name.split('.')[0];
    if (file.type === 'Application Resume') {
      fileName = `Resume_Internal_Use_Only`;
    }
    const { id: contentVerId } = await conn.sobject('ContentVersion').create({
      VersionData: file.fileContent as BlobString,
      PathOnClient: `${fileName}${deriveFileExtension(file.name)}`,
      Type__c: file.type,
      Bullhorn_ID__c: file.bhId
    });
    const { ContentDocumentId } = await conn.sobject('ContentVersion').retrieve(contentVerId);
    await conn.sobject('ContentDocumentLink').create({
      ContentDocumentId,
      LinkedEntityId: objectID,
      ShareType: 'V',
    });
  }
};

export const findFilesByBhId = async (
  conn: Connection<SmoothstackSchema>,
  bullhornIds: string[]
): Promise<Fields$ContentVersion[]> => {
  return await conn
    .sobject('ContentVersion')
    .find({
      Bullhorn_ID__c: { $in: bullhornIds },
    })
    .select('Id, Bullhorn_ID__c');
};

// export const downloadSFDCFile = async (
//   conn: Connection<SmoothstackSchema>,
//   contentVersionId: string
// ): Promise<SFDCFile> => {
//   return new Promise(async (resolve, reject) => {
//     const inMemoryStream = new MemoryStream(null, {
//       readable: false,
//     });
//     const file = await conn.sobject('ContentVersion').findOne({ Id: { $eq: contentVersionId } });
//     conn
//       .sobject('ContentVersion')
//       .record(contentVersionId)
//       .blob('VersionData')
//       .pipe(inMemoryStream)
//       .on('close', () => {
//         resolve({ ...file, VersionData_Base64: Buffer.from(inMemoryStream.toString()).toString('base64') });
//       })
//       .on('error', () => {
//         reject('Error Downloading ContentVersion Data');
//       });
//   });
// };

const deriveFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex == -1) {
    return '';
  } else {
    return `.${fileName.slice(lastDotIndex + 1)}`;
  }
};
