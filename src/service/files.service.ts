import { BlobString, Connection } from 'jsforce';
import { FileUpload } from '../model/File';
import { SmoothstackSchema } from '../model/smoothstack.schema';
// import MemoryStream from 'memorystream';

export const saveSFDCFiles = async (conn: Connection<SmoothstackSchema>, objectID: string, files: FileUpload[]) => {
  let resumeNum = 1;
  for (const file of files) {
    let fileName = file.type;
    if (file.type === 'Application Resume') {
      fileName = `Resume_Internal_Use_Only_${resumeNum}`;
      resumeNum++;
    }
    const { id: contentVerId } = await conn.sobject('ContentVersion').create({
      VersionData: file.fileContent as BlobString,
      PathOnClient: `${fileName}${deriveFileExtension(file.name)}`,
      Type__c: 'Application Resume',
    });
    const { ContentDocumentId } = await conn.sobject('ContentVersion').retrieve(contentVerId);
    await conn.sobject('ContentDocumentLink').create({
      ContentDocumentId,
      LinkedEntityId: objectID,
      ShareType: 'V',
    });
  }
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
