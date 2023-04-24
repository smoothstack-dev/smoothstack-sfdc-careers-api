import { BlobString, Connection } from 'jsforce';
import { SFDCNote } from '../model/Note';
import { SmoothstackSchema } from '../model/smoothstack.schema';

export const saveNote = async (conn: Connection<SmoothstackSchema>, objectID: string, note: SFDCNote) => {
  const { id: contentNoteId } = await conn
    .sobject('ContentNote')
    .create({ Title: note.title, Content: Buffer.from(note.content).toString('base64') as BlobString });
  await conn.sobject('ContentDocumentLink').create({ ContentDocumentId: contentNoteId, LinkedEntityId: objectID });
};
