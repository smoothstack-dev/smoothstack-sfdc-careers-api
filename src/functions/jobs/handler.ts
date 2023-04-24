import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { apply } from '../../service/apply.service';
import { fetchJobs } from '../../service/jobs.service';
import { getSFDCConnection } from '../../service/sfdc.service';
import { fetchCandidate, fetchCandidateFiles, findCandidateByEmailOrPhone } from '../../service/candidate.service';
import {
  fetchApplication,
  fetchApplicationHistory,
  findApplicationByAppointmentId,
} from '../../service/application.service';
import { SchedulingType } from '../../model/SchedulingType';
import { saveNote } from '../../service/notes.service';
// import MemoryStream from 'memorystream';
// import { downloadSFDCFile, saveSFDCFiles } from '../../service/files.service';
const jobs = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'GET':
        const conn = await getSFDCConnection();
        return await fetchApplicationHistory(conn, { id: '0065G00000v2xHKQAY' }, 'Rejection_Reason__c');
        // //return await conn.sobject('ContentDocumentLink').find({LinkedEntityId: { $eq: '0065G00000v2VeEQAU' }}).select('ContentDocument.*')
        // // return await conn
        // //   .sobject('ContentVersion')
        // //   .findOne({ ContentDocumentId: { $eq: '0695G000012myNwQAI' }, $and: { Type__c: 'Application Resume' } }).select('VersionData')
        // let x = new MemoryStream(null, {
        //   readable: false,
        // });
        // return await conn
        //   .sobject('ContentVersion')
        //   .record('0685G000019jgU9QAI')
        //   .blob('VersionData')
        //   .pipe(x)
        //   .on('close',() => {
        //     console.log('asdsa');
        //     // console.log(x.toString());
        //     const y = Buffer.from(x.toString()).toString('base64');
        //     console.log(y)
        //   });
        // const files = await fetchCandidateFiles(conn, '0065G00000v2VeEQAU', 'Application Resume');
        // console.log(files);
        // const file = await downloadSFDCFile(conn, files[0].Id);
        // await saveSFDCFiles(conn, '0065G00000v2VeEQAU', [
        //   {
        //     contentType: 'application/pdf',
        //     name: 'application.pdf',
        //     type: 'Application Resume',
        //     fileContent: file.VersionData_Base64,
        //   },
        // ]);
        await saveNote(conn, '0035G00002kULTCQA4', { title: 'Test Note', content: 'La concha de la lora' });

      case 'POST':
        return await apply(event as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(jobs);
