import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { Candidate } from '../model/Candidate';
import { CANDIDATE_RECORD_TYPE_ID } from './candidate.service';
import { CONSULTANT_RECORD_TYPE_ID } from './consultant.service';

export const findContactByEmailOrPhone = async (
  conn: Connection<SmoothstackSchema>,
  email: string,
  phone: string
): Promise<Candidate> => {
  return await conn
    .sobject('Contact')
    .findOne({
      $or: [{ Email: { $eq: email ?? null } }, { MobilePhone: { $eq: phone ?? null } }],
      $and: { RecordTypeId: { $in: [CANDIDATE_RECORD_TYPE_ID, CONSULTANT_RECORD_TYPE_ID] } },
    })
    .include('Applications__r')
    .end();
};
