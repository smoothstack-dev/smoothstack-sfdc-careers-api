import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { Candidate } from '../model/Candidate';
import { CONSULTANT_RECORD_TYPE_ID } from './consultant.service';
import { SACandidate } from '../model/Candidate.sa';

export const findContactByEmailOrPhone = async (
  conn: Connection<SmoothstackSchema>,
  email: string,
  phone: string,
  contactRecordType: string
): Promise<Candidate | SACandidate> => {
  return await conn
    .sobject('Contact')
    .findOne({
      $or: [{ Email: { $eq: email ?? null } }, { MobilePhone: { $eq: phone ?? null } }],
      $and: { RecordTypeId: { $in: [contactRecordType, CONSULTANT_RECORD_TYPE_ID] } },
    })
    .include('Applications__r')
    .end()
    .include('Marketing__r')
    .end();
};
