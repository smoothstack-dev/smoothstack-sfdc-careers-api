import { config, connect, query } from 'mssql';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { Fields$Contact, Fields$Job__c, Fields$Opportunity, SmoothstackSchema } from '../model/smoothstack.schema';
import { Connection, DateString } from 'jsforce';
import { readFile, writeFile } from 'fs/promises';
import { findCandidatesByEmail } from './candidate.service';
import { deriveApplicationStatus } from '../util/application.util';
import { findAppsByAbilitytoLearn, findAppsByBhId, updateApplication } from './application.service';
import { findFilesByBhId, saveSFDCFiles } from './files.service';
import { FileUpload } from '../model/File';

// TODOS: Delete Bullhorn_ID field from Opportunity and Content Version
const SQL_CONFIG: config = {
  user: 'oscarnoel2',
  password: 'Hur373612',
  database: 'BULLHORN21289',
  server: 'localhost',
  port: 1433,
  pool: {
    max: 10000,
    min: 0,
    idleTimeoutMillis: 1500,
  },
  options: {
    // requestTimeout: 60000,
    //   encrypt: true, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

export const migrateJobs = async () => {
  const conn = await getSFDCConnection();
  await connect(SQL_CONFIG);
  const result = await query('SELECT * FROM BH_JobOpportunity WHERE jobPostingID NOT IN (1,2,3,14,16,55)');

  const bhJobs = result.recordset.map((job) => {
    const sfdcJob: Partial<Fields$Job__c> = {
      Allowable_Work_Authorization__c: job.customText4?.replaceAll(',', ';'),
      Coding_Challenge_Info__c: job.customTextBlock1,
      Coding_Challenge_Name__c: job.customText1,
      Cohort_Category__c: job.customText5,
      Job_Details_JSON__c: job.customTextBlock2,
      Job_ID__c: job.jobPostingID,
      Job_Location__c: job.willRelocate === 1 ? 'Onsite' : 'Remote',
      Job_Title__c: job.title,
      Max_Months_to_Graduation__c: job.customText8 ?? 'Not Specified',
      Min_Coding_Self_Rank__c: job.customText10,
      Min_Degree_Required__c: job.educationDegree ?? 'Not Specified',
      Min_Years_of_Coding_Experience__c: job.customText9 ?? 'Not Specified',
      Passing_Challenge_Score__c: job.customInt1 ?? 70,
      Publishing_Status__c: 'Unpublished',
      Quick_Course_Start_Date__c: new Date(job.startDate).toISOString().split('T')[0] as DateString,
      Training_Length_Weeks__c: job.customText6,
      Year_1_Salary__c: job.salary,
      Year_2_Salary__c: job.customFloat1 ?? 70000,
    };
    return sfdcJob;
  });
  console.log(bhJobs);
  const res = await conn._createMany('Job__c', bhJobs, {});
  console.log(res[0].errors);
};

export const migrateCandidates = async () => {
  const conn = await getSFDCConnection();
  await connect(SQL_CONFIG);
  const result = await query(
    "WITH RankedRecords AS (SELECT ci.*, u.userId, ROW_NUMBER() OVER (PARTITION BY u.userId ORDER BY ci.dateAdded DESC) AS rn FROM BH_UserCustomObjectInstance u JOIN BH_CustomObjectInstance ci ON u.instanceId = ci.instanceId), BH_PrescreenObject AS (SELECT * FROM RankedRecords WHERE rn = 1), RankedRecords2 AS (SELECT c.*, ROW_NUMBER() OVER (PARTITION BY buc.email ORDER BY c.candidateID DESC) AS rn FROM BH_Candidate c JOIN BH_UserContact buc on c.userID = buc.userID), BH_LatestCandidate AS (SELECT * FROM RankedRecords2 WHERE rn = 1) SELECT c.candidateID, c.sfdc_id as candidate_sfdc_id, c.userID, uc.firstName, uc.lastName, uc.nickName, uc.address1, uc.address2, uc.city, cf.customText31 as county, uc.state, uc.zip, uc.email, uc.mobile, cf.customText39 as potential_smoothstack_email, cf.customText28 as potential_smoothstack_email_qc, c.dateAdded as candidate_date_added, jr.jobPostingID, jo.sfdc_id as job_sfdc_id, jr.dateAdded as app_date_added, c.status as candidate_status, jr.status as app_status, uc.customText4 as work_authorization, uc.customText9 as months_to_graduation, cf.customText25 as willing_to_relocate, uc.customText7 as coding_self_rank, uc.customText3 as years_of_exp_self, uc.customText14 as comm_skills_recruiter, uc.customText15 as comm_skills_tech, cf.customInt14 as candidate_rank_recruiter, uc.customText20 as candidate_on_time_techscreen, p.text1 as candidate_on_time_prescreen, cf.customText21 as candidate_dressed_professionally, uc.degreeList as expected_degree, uc.educationDegree as education_level, uc.customDate3 as expected_graduation_date, cf.customDate10 as graduation_date, cf.customText38 as major, jr.customDate1 as challenge_date, jr.customText12 as challenge_score, jr.customTextBlock1 as challenge_scheduling_link, jr.customText10 as challenge_result, jr.customText11 as challenge_appointment_status, jr.customText13 as challenge_similarity_flag, jr.customTextBlock4 as challenge_link, cf.customDate13 as webinar_date, cf.customText30 as webinar_appointment_status, uc.customTextBlock3 as webinar_scheduling_link, uc.customText12 as webinar_attended, uc.customTextBlock4 as webinar_link, uc.customText13 as webinar_poll_response, cf.customText23 as opportunity_rank, cf.customText24 as two_year_commitment, cf.customTextBlock9 as additional_questions, uc.customTextBlock5 as about_yourself, p.text3 as refer_a_friend, uc.customText11 as external_applications, uc.customTextBlock2 as projects, p.textBlock4 as responsive_notes, cf.customText26 as months_project_experience, cf.customText27 as prescreen_result, cf.customText33 as good_fit, p.textBlock1 as ability_to_learn_quickly, p.textBlock2 as challenging_situation, uc.customText8 as vaccination_status, p.text4 as vaccination_notes, p.text7 as drug_screen_notes, p.text2 as background_check_notes, jr.customDate2 as tech_screen_date, uc.customText16 as total_technical_score, jr.customText22 as tech_screen_appointment_status, uc.customText18 as total_project_score, jr.customTextBlock2 as tech_screen_scheduling_link, uc.customText17 as total_behavioral_score, jr.customTextBlock3 as tech_screen_cancellation_link, jr.customText18 as tech_screen_result, cf.customText22 as screener_determination, jr.comments as application_device, jr.customText25 as utm_term, jr.source as utm_source, jr.customText24 as utm_medium, jr.customText6 as utm_campaign, uc.customText2 as military_status, uc.customText10 as military_branch FROM BH_UserContact uc JOIN BH_UserAdditionalCustomFields cf ON cf.userID = uc.userID LEFT JOIN BH_PrescreenObject p ON p.userID = uc.userID JOIN BH_LatestCandidate c ON uc.userID = c.userID JOIN BH_JobResponse jr ON jr.userID = c.userID JOIN BH_JobOpportunity jo ON jr.jobPostingID = jo.jobPostingID WHERE c.status IN ('Active', 'DNU', 'Engaged', 'Snooze', 'Rejected') AND c.migrated = 0 AND jr.migrated = 0 AND c.isDeleted = 0 AND jr.isDeleted = 0 AND c.dateAdded > '2021-08-20' AND uc.userID NOT IN (SELECT userID FROM BH_UserContact uc WHERE LOWER(name) LIKE '%test' OR LOWER(name) LIKE '%tester' OR LOWER(name) LIKE '%testing' OR LOWER(firstName) LIKE '%test' OR LOWER(firstName) LIKE '%tester' OR LOWER(firstName) LIKE '%testing' OR LOWER(lastName) LIKE '%test' OR LOWER(lastName) LIKE '%tester' OR LOWER(lastName) LIKE '%testing') AND jo.jobPostingID NOT IN (1, 2, 3, 14, 16) AND uc.isDeleted = 0 ORDER BY c.candidateID ASC"
  );
  console.log(result.recordset.length);
  const candidateMap = new Map<number, any>();
  // Loop through the array and populate the candidate map with unique candidates
  result.recordset.forEach((item) => {
    if (!candidateMap.has(item.candidateID)) {
      candidateMap.set(item.candidateID, item);
    }
  });
  const uniqueCandidates = Array.from(candidateMap.values());
  // const slicedCandidates = uniqueCandidates.slice(0, 10000);
  const candidatesToMigrate = await removeDupeCandidates(conn, uniqueCandidates);
  const sfdcCandidates = candidatesToMigrate.map((c) => {
    const sfdcCandidate: Partial<Fields$Contact> = {
      FirstName: c.firstName,
      LastName: c.lastName,
      Nickname__c: c.nickName,
      Email: c.email,
      MobilePhone: c.mobile,
      ...(isEmailAddress(c.potential_smoothstack_email) && {
        Potential_Smoothstack_Email__c: c.potential_smoothstack_email,
      }),
      Candidate_Status__c: c.candidate_status,
      // CreatedDate: new Date().toISOString() as DateString, // TODO: Remove
      MailingStreet: `${c.address1?.trim() ?? ''} ${c.address2?.trim() ?? ''}`.trim() || null,
      MailingCity: c.city?.trim() ?? null,
      MailingState: deriveMailingState(c.state),
      MailingPostalCode: c.zip?.trim() ?? null,
      County__c: c.county?.trim() ?? null,
      MailingCountry: 'United States',
      RecordTypeId: '0125G000000feaZQAQ',
      Is_Migrated__c: true,
    };
    return sfdcCandidate;
  });

  const candidateIDs = candidatesToMigrate.map((c) => c.candidateID);
  const res = await conn._createMany('Contact', sfdcCandidates, {
    allOrNone: true,
    allowRecursive: true,
    headers: { 'Sforce-Duplicate-Rule-Header': 'allowSave=true' },
  });
  if (res.some((r) => !!r.errors.length)) {
    console.log(
      'Found errors: ',
      res
        .filter(
          (r) => !!r.errors.length && r.errors.some((e: any) => e.statusCode !== 'ALL_OR_NONE_OPERATION_ROLLED_BACK')
        )
        .map((r) => r.errors)
    );
    return;
  }

  const migratedCandidates = sfdcCandidates.map((c, i) => ({ ...c, sfdcId: res[i].id, bhId: candidateIDs[i] }));
  const jsonData = JSON.stringify(migratedCandidates, null, 2);
  await writeFile('candidates.json', jsonData);
  console.log('Done migrating and writing to file: candidates.json');

  // Generate SQL updates
  const migratedBatches = chunkArray(migratedCandidates, 1000);
  for (const migratedBatch of migratedBatches) {
    const updates = migratedBatch.map((c) => {
      return query(`UPDATE BH_Candidate SET sfdc_id = '${c.sfdcId}', migrated = 1 WHERE candidateID = ${c.bhId}`);
    });

    const batches = chunkArray(updates, 50);

    for (const batch of batches) {
      await Promise.all(batch);
    }
  }
  console.log('Done persisting sfdcId in local DB');

  // await query(`UPDATE BH_Candidate SET migrated = 1 WHERE candidateID IN(${candidateIDs.join(',')})`);
};

export const migrateApplications = async () => {
  const conn = await getSFDCConnection();
  await connect(SQL_CONFIG);
  const result = await query(
    "WITH RankedRecords AS (SELECT ci.*, u.userId, ROW_NUMBER() OVER (PARTITION BY u.userId ORDER BY ci.dateAdded DESC) AS rn FROM BH_UserCustomObjectInstance u JOIN BH_CustomObjectInstance ci ON u.instanceId = ci.instanceId), BH_PrescreenObject AS (SELECT * FROM RankedRecords WHERE rn = 1), RankedRecords2 AS (SELECT c.*, ROW_NUMBER() OVER (PARTITION BY buc.email ORDER BY c.candidateID DESC) AS rn FROM BH_Candidate c JOIN BH_UserContact buc on c.userID = buc.userID), BH_LatestCandidate AS (SELECT * FROM RankedRecords2 WHERE rn = 1) SELECT c.candidateID, c.sfdc_id as candidate_sfdc_id, c.userID, uc.firstName, uc.lastName, uc.nickName, uc.address1, uc.address2, uc.city, cf.customText31 as county, uc.state, uc.zip, uc.email, uc.mobile, cf.customText39 as potential_smoothstack_email, cf.customText28 as potential_smoothstack_email_qc, c.dateAdded as candidate_date_added, jr.jobPostingID, jr.jobResponseID, jo.sfdc_id as job_sfdc_id, jr.dateAdded as app_date_added, c.status as candidate_status, jr.status as app_status, uc.customText4 as work_authorization, uc.customText9 as months_to_graduation, cf.customText25 as willing_to_relocate, uc.customText7 as coding_self_rank, uc.customText3 as years_of_exp_self, uc.customText14 as comm_skills_recruiter, uc.customText15 as comm_skills_tech, cf.customInt14 as candidate_rank_recruiter, uc.customText20 as candidate_on_time_techscreen, p.text1 as candidate_on_time_prescreen, cf.customText21 as candidate_dressed_professionally, uc.degreeList as expected_degree, uc.educationDegree as education_level, uc.customDate3 as expected_graduation_date, cf.customDate10 as graduation_date, cf.customText38 as major, jr.customDate1 as challenge_date, jr.customText12 as challenge_score, jr.customTextBlock1 as challenge_scheduling_link, jr.customText10 as challenge_result, jr.customText11 as challenge_appointment_status, jr.customText13 as challenge_similarity_flag, jr.customTextBlock4 as challenge_link, cf.customDate13 as webinar_date, cf.customText30 as webinar_appointment_status, uc.customTextBlock3 as webinar_scheduling_link, uc.customText12 as webinar_attended, uc.customTextBlock4 as webinar_link, uc.customText13 as webinar_poll_response, cf.customText23 as opportunity_rank, cf.customText24 as two_year_commitment, cf.customTextBlock9 as additional_questions, uc.customTextBlock5 as about_yourself, p.text3 as refer_a_friend, uc.customText11 as external_applications, uc.customTextBlock2 as projects, p.textBlock4 as responsive_notes, cf.customText26 as months_project_experience, cf.customText27 as prescreen_result, cf.customText33 as good_fit, p.textBlock1 as ability_to_learn_quickly, p.textBlock2 as challenging_situation, uc.customText8 as vaccination_status, p.text4 as vaccination_notes, p.text7 as drug_screen_notes, p.text2 as background_check_notes, jr.customDate2 as tech_screen_date, uc.customText16 as total_technical_score, jr.customText22 as tech_screen_appointment_status, uc.customText18 as total_project_score, jr.customTextBlock2 as tech_screen_scheduling_link, uc.customText17 as total_behavioral_score, jr.customTextBlock3 as tech_screen_cancellation_link, jr.customText18 as tech_screen_result, cf.customText22 as screener_determination, jr.comments as application_device, jr.customText25 as utm_term, jr.source as utm_source, jr.customText24 as utm_medium, jr.customText6 as utm_campaign, uc.customText2 as military_status, uc.customText10 as military_branch FROM BH_UserContact uc JOIN BH_UserAdditionalCustomFields cf ON cf.userID = uc.userID LEFT JOIN BH_PrescreenObject p ON p.userID = uc.userID JOIN BH_LatestCandidate c ON uc.userID = c.userID JOIN BH_JobResponse jr ON jr.userID = c.userID JOIN BH_JobOpportunity jo ON jr.jobPostingID = jo.jobPostingID WHERE c.status IN ('Active', 'DNU', 'Engaged', 'Snooze', 'Rejected') AND c.migrated = 1 AND jr.migrated = 0 AND c.isDeleted = 0 AND jr.isDeleted = 0 AND c.dateAdded > '2021-08-20' AND uc.userID NOT IN (SELECT userID FROM BH_UserContact uc WHERE LOWER(name) LIKE '%test' OR LOWER(name) LIKE '%tester' OR LOWER(name) LIKE '%testing' OR LOWER(firstName) LIKE '%test' OR LOWER(firstName) LIKE '%tester' OR LOWER(firstName) LIKE '%testing' OR LOWER(lastName) LIKE '%test' OR LOWER(lastName) LIKE '%tester' OR LOWER(lastName) LIKE '%testing') AND jo.jobPostingID NOT IN (1, 2, 3, 14, 16) AND uc.isDeleted = 0 ORDER BY C.candidateID ASC"
  );
  console.log(result.recordset.length);
  const slicedApps = result.recordset;
  const appsToMigrate = await removeDupeApplications(conn, slicedApps);
  const sfdcApplications = appsToMigrate.map((a) => {
    const { stageName, rejectionReason, snoozeReason } = deriveApplicationStatus(mapAppStage(a.app_status));
    const applicationRecord: Partial<Fields$Opportunity> = {
      RecordTypeId: '0125G000000feaeQAA',
      CloseDate: new Date(a.app_date_added).toISOString() as DateString,
      Application_Date__c: new Date(a.app_date_added).toISOString() as DateString,
      StageName: stageName,
      ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
      ...(snoozeReason && { Snooze_Reason__c: snoozeReason }),
      Application_Device__c: a.comments,
      UTM_Source__c: a.utm_source,
      UTM_Medium__c: a.utm_medium,
      UTM_Campaign__c: a.utm_campaign,
      UTM_Term__c: !isWorkAuth(a.utm_term) ? a.utm_term : null,
      Work_Authorization__c: a.work_authorization,
      Willing_to_Relocate__c: a.willing_to_relocate,
      Coding_Self_Rank__c: isNumeric(a.coding_self_rank) ? +a.coding_self_rank : null,
      Years_of_Experience_Self_Disclosed__c: a.years_of_exp_self,
      ...(a.graduation_date && {
        Graduation_Date__c: new Date(a.graduation_date).toISOString().split('T')[0] as DateString,
      }),
      ...(a.expected_graduation_date && {
        Expected_Graduation_Date__c: new Date(a.expected_graduation_date).toISOString().split('T')[0] as DateString,
      }),
      Months_to_Graduation__c: isNumeric(a.months_to_graduation) ? +a.months_to_graduation : null,
      Expected_Degree__c: a.expected_degree,
      Education_Level__c: a.education_level,
      Military_Status__c: a.military_status,
      Military_Branch__c: a.military_branch,
      Major__c: a.major,
      Communication_Rank_Recruiter__c: isNumeric(a.comm_skills_recruiter) ? +a.comm_skills_recruiter : null,
      Communication_Rank_Tech_Screener__c: isNumeric(a.comm_skills_tech) ? +a.comm_skills_tech : null,
      Overall_Candidate_Rank_Recruiter__c: isNumeric(a.candidate_rank_recruiter) ? +a.candidate_rank_recruiter : null,
      Candidate_on_Time_Prescreen__c: a.candidate_on_time_prescreen,
      Candidate_on_Time_Tech_Screen__c: a.candidate_on_time_techscreen,
      Dressed_Professionally__c: a.candidate_dressed_professionally,
      ...(a.challenge_Date && { Challenge_Date_Time__c: new Date(a.challenge_date).toISOString() as DateString }),
      Challenge_Score__c: isNumeric(a.challenge_score) ? +a.challenge_score : null,
      Challenge_Scheduling_Link__c: a.challenge_scheduling_link,
      Challenge_Result__c: ['Pass', 'Fail'].includes(a.challenge_result) ? a.challenge_result : null,
      Challenge_Appointment_Status__c: a.challenge_appointment_status,
      Challenge_Similarity_Flag__c: a.challenge_similarity_flag,
      Challenge_Link__c: a.challenge_result?.includes('codility')
        ? a.challenge_result
        : a.months_to_graduation?.includes('codility')
        ? a.months_to_graduation
        : a.challenge_link,
      ...(a.webinar_date && { Webinar_Date__c: new Date(a.webinar_date).toISOString() as DateString }),
      Webinar_Appointment_Status__c: a.webinar_appointment_status,
      Webinar_Scheduling_Link__c: a.webinar_scheduling_link,
      Webinar_Attended__c: a.webinar_attended,
      Webinar_Link__c: a.webinar_link,
      Webinar_Poll_Response__c: a.webinar_poll_response,
      Opportunity_Rank__c: a.opportunity_rank,
      Two_Year_Committment__c: a.two_year_commitment,
      Additional_Questions__c: a.additional_questions,
      About_Yourself__c: a.about_yourself,
      Refer_a_Friend__c: a.refer_a_friend,
      External_Applications__c: a.external_applications,
      Projects__c: a.projects,
      Responsive_Notes__c: a.responsive_notes,
      Project_Experience_Months__c: a.months_project_experience,
      Prescreen_Result__c: a.prescreen_result,
      Good_Fit__c: a.good_fit,
      Additional_Notes_Prescreen__c: a.ability_to_learn_quickly,
      Challenging_Situation__c: a.challenging_situation,
      Vaccination_Status__c: a.vaccination_status,
      Vaccination_Notes__c: a.vaccination_notes,
      Drug_Screen_Notes__c: a.drug_screen_notes,
      Background_Check_Notes__c: a.background_check_notes,
      ...(a.tech_screen_date && { Tech_Screen_Date__c: new Date(a.tech_screen_date).toISOString() as DateString }),
      Total_Technical_Score__c: a.total_technical_score,
      Tech_Screen_Appointment_Status__c: a.tech_screen_appointment_status,
      Total_Project_Score__c: a.total_project_score,
      Tech_Screen_Scheduling_Link__c: a.tech_screen_scheduling_link,
      Total_Behavioral_Score__c: a.total_behavioral_score,
      Tech_Screen_Cancellation_Link__c: a.tech_screen_cancellation_link,
      Tech_Screen_Result__c: a.tech_screen_result,
      Screener_Determination__c: a.screener_determination,
      Candidate__c: a.candidate_sfdc_id,
      Job__c: a.job_sfdc_id,
      Bullhorn_ID__c: `${a.jobResponseID}`,
      Is_Migrated__c: true,
    };
    return applicationRecord;
  });
  // console.log(sfdcApplications);

  const appIDs = appsToMigrate.map((c) => c.jobResponseID);
  const res = await conn._createMany('Opportunity', sfdcApplications, {
    allOrNone: true,
    allowRecursive: true,
  });
  if (res.some((r) => !!r.errors.length)) {
    console.log(
      'Found errors: ',
      res
        .filter(
          (r) => !!r.errors.length && r.errors.some((e: any) => e.statusCode !== 'ALL_OR_NONE_OPERATION_ROLLED_BACK')
        )
        .map((r) => r.errors)
    );
    return;
  }

  const migratedApps = sfdcApplications.map((a, i) => ({ ...a, sfdcId: res[i].id, bhId: appIDs[i] }));
  const jsonData = JSON.stringify(migratedApps, null, 2);
  await writeFile('apps.json', jsonData);
  console.log('Done migrating and writing to file: apps.json');

  // Generate SQL updates
  const migratedBatches = chunkArray(migratedApps, 1000);
  for (const migratedBatch of migratedBatches) {
    const updates = migratedBatch.map((a) => {
      return query(`UPDATE BH_JobResponse SET sfdc_id = '${a.sfdcId}', migrated = 1 WHERE jobResponseID = ${a.bhId}`);
    });

    const batches = chunkArray(updates, 50);

    for (const batch of batches) {
      await Promise.all(batch);
    }
  }
  console.log('Done persisting sfdcId in local DB');
};

export const migrateFiles = async () => {
  const conn = await getSFDCConnection();
  await connect(SQL_CONFIG);
  const result = await query(
    "WITH RankedRecords AS (SELECT ci.*, u.userId, ROW_NUMBER() OVER (PARTITION BY u.userId ORDER BY ci.dateAdded DESC) AS rn FROM BH_UserCustomObjectInstance u JOIN BH_CustomObjectInstance ci ON u.instanceId = ci.instanceId), BH_PrescreenObject AS (SELECT * FROM RankedRecords WHERE rn = 1), RankedRecords2 AS (SELECT c.*, ROW_NUMBER() OVER (PARTITION BY buc.email ORDER BY c.candidateID DESC) AS rn FROM BH_Candidate c JOIN BH_UserContact buc on c.userID = buc.userID), BH_LatestCandidate AS (SELECT * FROM RankedRecords2 WHERE rn = 1) SELECT c.candidateID, uwf.userWorkFileID, uwf.directory, jr.sfdc_id as app_sfdc_id, uwf.name as file_name, uw.type as file_type, uwf.fileSize, uwf.fileExtension, c.sfdc_id as candidate_sfdc_id, c.userID, uc.firstName, uc.lastName, uc.nickName, uc.address1, uc.address2, uc.city, cf.customText31 as county, uc.state, uc.zip, uc.email, uc.mobile, cf.customText39 as potential_smoothstack_email, cf.customText28 as potential_smoothstack_email_qc, c.dateAdded as candidate_date_added, jr.jobPostingID, jr.jobResponseID, jo.sfdc_id as job_sfdc_id, jr.dateAdded as app_date_added, c.status as candidate_status, jr.status as app_status, uc.customText4 as work_authorization, uc.customText9 as months_to_graduation, cf.customText25 as willing_to_relocate, uc.customText7 as coding_self_rank, uc.customText3 as years_of_exp_self, uc.customText14 as comm_skills_recruiter, uc.customText15 as comm_skills_tech, cf.customInt14 as candidate_rank_recruiter, uc.customText20 as candidate_on_time_techscreen, p.text1 as candidate_on_time_prescreen, cf.customText21 as candidate_dressed_professionally, uc.degreeList as expected_degree, uc.educationDegree as education_level, uc.customDate3 as expected_graduation_date, cf.customDate10 as graduation_date, cf.customText38 as major, jr.customDate1 as challenge_date, jr.customText12 as challenge_score, jr.customTextBlock1 as challenge_scheduling_link, jr.customText10 as challenge_result, jr.customText11 as challenge_appointment_status, jr.customText13 as challenge_similarity_flag, jr.customTextBlock4 as challenge_link, cf.customDate13 as webinar_date, cf.customText30 as webinar_appointment_status, uc.customTextBlock3 as webinar_scheduling_link, uc.customText12 as webinar_attended, uc.customTextBlock4 as webinar_link, uc.customText13 as webinar_poll_response, cf.customText23 as opportunity_rank, cf.customText24 as two_year_commitment, cf.customTextBlock9 as additional_questions, uc.customTextBlock5 as about_yourself, p.text3 as refer_a_friend, uc.customText11 as external_applications, uc.customTextBlock2 as projects, p.textBlock4 as responsive_notes, cf.customText26 as months_project_experience, cf.customText27 as prescreen_result, cf.customText33 as good_fit, p.textBlock1 as ability_to_learn_quickly, p.textBlock2 as challenging_situation, uc.customText8 as vaccination_status, p.text4 as vaccination_notes, p.text7 as drug_screen_notes, p.text2 as background_check_notes, jr.customDate2 as tech_screen_date, uc.customText16 as total_technical_score, jr.customText22 as tech_screen_appointment_status, uc.customText18 as total_project_score, jr.customTextBlock2 as tech_screen_scheduling_link, uc.customText17 as total_behavioral_score, jr.customTextBlock3 as tech_screen_cancellation_link, jr.customText18 as tech_screen_result, cf.customText22 as screener_determination, jr.comments as application_device, jr.customText25 as utm_term, jr.source as utm_source, jr.customText24 as utm_medium, jr.customText6 as utm_campaign, uc.customText2 as military_status, uc.customText10 as military_branch FROM BH_UserContact uc JOIN BH_UserAdditionalCustomFields cf ON cf.userID = uc.userID LEFT JOIN BH_PrescreenObject p ON p.userID = uc.userID JOIN BH_LatestCandidate c ON uc.userID = c.userID JOIN BH_JobResponse jr ON jr.userID = c.userID JOIN BH_JobOpportunity jo ON jr.jobPostingID = jo.jobPostingID JOIN BH_UserWork uw ON uw.userID = c.userID JOIN BH_UserWorkFile uwf ON uwf.userWorkID = uw.userWorkID WHERE c.status IN ('Active', 'DNU', 'Engaged', 'Snooze', 'Rejected') AND c.migrated = 1 AND jr.migrated = 1 AND uwf.migrated = 0 AND uwf.missing = 0 AND c.isDeleted = 0 AND jr.isDeleted = 0 AND uwf.isDeleted = 0 AND c.dateAdded > '2021-08-20' AND uc.userID NOT IN (SELECT userID FROM BH_UserContact uc WHERE LOWER(name) LIKE '%test' OR LOWER(name) LIKE '%tester' OR LOWER(name) LIKE '%testing' OR LOWER(firstName) LIKE '%test' OR LOWER(firstName) LIKE '%tester' OR LOWER(firstName) LIKE '%testing' OR LOWER(lastName) LIKE '%test' OR LOWER(lastName) LIKE '%tester' OR LOWER(lastName) LIKE '%testing') AND jo.jobPostingID NOT IN (1, 2, 3, 14, 16) AND uc.isDeleted = 0 ORDER BY C.candidateID ASC, uwf.dateAdded DESC"
  );
  console.log(result.recordset.length);
  const slicedFiles = result.recordset;
  const filesToMigrate = await removeDupeFiles(conn, slicedFiles);
  // const fileIDs = filesToMigrate.map((c) => c.userWorkFileID);
  for (const file of filesToMigrate) {
    if (file.fileSize > 0) {
      const filePath = file.directory.replaceAll('\\', '/');
      const fileName = file.file_name.replaceAll(' ', '_');
      let data: string;
      try {
        data = await readFile(
          `/home/oscarnoel2/Desktop/bh-backup/UserFiles/UserWorkFiles/${filePath}${file.userWorkFileID}${file.fileExtension}`,
          {
            encoding: 'base64',
          }
        );
      } catch (e) {
        console.error(e.message);
        if (e.message.includes('ENOENT')) {
          await query(`UPDATE BH_UserWorkFile SET missing = 1 WHERE userWorkFileID = ${file.userWorkFileID}`);
          console.log('Skipped missing File');
          continue;
        } else {
          throw e;
        }
      }
      const fileUpload: FileUpload = {
        name: fileName,
        type: deriveFileType(file.file_type),
        fileContent: data,
        bhId: file.userWorkFileID,
      };
      await saveSFDCFiles(conn, file.app_sfdc_id, [fileUpload]);
    }
    await query(`UPDATE BH_UserWorkFile SET migrated = 1 WHERE userWorkFileID = ${file.userWorkFileID}`);
    console.log('Migrated File');
  }
  console.log('Done Migrating Files');

  // console.log(sfdcApplications);

  // const migratedApps = sfdcApplications.map((a, i) => ({ ...a, sfdcId: res[i].id, bhId: appIDs[i] }));
  // const jsonData = JSON.stringify(migratedApps, null, 2);
  // await writeFile('apps.json', jsonData);
  // console.log('Done migrating and writing to file: apps.json');

  // // Generate SQL updates
  // const migratedBatches = chunkArray(migratedApps, 1000);
  // for (const migratedBatch of migratedBatches) {
  //   const updates = migratedBatch.map((a) => {
  //     return query(`UPDATE BH_JobResponse SET sfdc_id = '${a.sfdcId}', migrated = 1 WHERE jobResponseID = ${a.bhId}`);
  //   });

  //   const batches = chunkArray(updates, 50);

  //   for (const batch of batches) {
  //     await Promise.all(batch);
  //   }
  // }
  // console.log('Done persisting sfdcId in local DB');
};

const deriveFileType = (type: string) => {
  if (['resume', 'formatted resume'].includes(type?.toLowerCase().trim())) {
    return 'Application Resume';
  }
  if (['other', null, 'cover letter'].includes(type?.toLowerCase().trim())) {
    return 'Other';
  }
  if (['engagement offer', 'se offer'].includes(type?.toLowerCase().trim())) {
    return 'Quick Course Offer';
  }
  if (
    ['pre-apprenticeship enrollment form', 'apprenticeship application', 'pre-apprenticeship Form'].includes(
      type?.toLowerCase().trim()
    )
  ) {
    return 'Apprenticeship Docs';
  }
  if (['vaccine card'].includes(type?.toLowerCase().trim())) {
    return 'Vaccination Card';
  }
  return 'Other';
};

const isWorkAuth = (field: string) => {
  return [
    'DACA',
    'EAD',
    'H-1B',
    'H-4/EAD',
    'Not Authorized',
    'OPT/EAD',
    'Other',
    'Permanent Resident',
    'US Citizen',
  ].includes(field);
};

const isEmailAddress = (email: string) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailPattern.test(email?.trim());
};

const chunkArray = (arr: any, chunkSize: number) => {
  const chunked = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunked.push(arr.slice(i, i + chunkSize));
  }
  return chunked;
};

export const deriveMailingState = (mailingState: string) => {
  if (mailingState?.length === 2) {
    return getStateName(mailingState?.trim().toUpperCase());
  }

  return Object.values(stateList)
    .map((s) => s.toLowerCase())
    .includes(mailingState?.trim().toLowerCase())
    ? mailingState?.trim()
    : null;
};

export const getStateName = function (stateCode: string) {
  return stateList[stateCode];
};

const stateList = {
  AZ: 'Arizona',
  AL: 'Alabama',
  AK: 'Alaska',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

export const removeDupeCandidates = async (conn: Connection<SmoothstackSchema>, candidateList: any) => {
  // Find Dupe Candidates
  const chunkCandidates = chunkArray(candidateList, 200);
  let dupes = [];
  for (const chunk of chunkCandidates) {
    console.log('Fetching new dupe batch');
    dupes.push(
      ...(await findCandidatesByEmail(
        conn,
        chunk.map((c) => c.email)
      ))
    );
  }

  const foundDupeEmails = new Set(dupes.map((d) => d.Email.toLowerCase()));
  const candidatesToMigrate = candidateList.filter((c) => !foundDupeEmails.has(c.email.toLowerCase()));
  console.log('Dupe Cands', dupes);
  const dupeBatches = chunkArray(dupes, 1000);
  for (const dupeBatch of dupeBatches) {
    const queries = dupeBatch.map((d) => {
      return query(
        `UPDATE c SET c.sfdc_id = '${d.Id}', migrated = 1 FROM BH_Candidate AS c JOIN BH_UserContact AS uc ON c.userID = uc.userID WHERE LOWER(uc.email) = LOWER('${d.Email}')`
      );
    });

    const chunks = chunkArray(queries, 50);

    for (const batch of chunks) {
      await Promise.all(batch);
    }
  }
  console.log('Done updating dupes in local DB and removing them from candidateList to migrate');
  return candidatesToMigrate;
};

export const removeDupeApplications = async (conn: Connection<SmoothstackSchema>, applicationList: any) => {
  // Find Dupe Applications
  const chunkApplications = chunkArray(applicationList, 200);
  let dupes = [];
  for (const chunk of chunkApplications) {
    console.log('Fetching new dupe batch');
    dupes.push(
      ...(await findAppsByBhId(
        conn,
        chunk.map((c) => `${c.jobResponseID}`)
      ))
    );
  }
  const foundDupeApps = new Set(dupes.map((d) => +d.Bullhorn_ID__c));
  const appsToMigrate = applicationList.filter((c) => !foundDupeApps.has(c.jobResponseID));
  console.log('Dupe Apps', dupes);
  const dupeBatches = chunkArray(dupes, 1000);
  for (const dupeBatch of dupeBatches) {
    const queries = dupeBatch.map((d) => {
      return query(
        `UPDATE BH_JobResponse SET sfdc_id = '${d.Id}', migrated = 1 WHERE jobResponseID = ${d.Bullhorn_ID__c}`
      );
    });

    const chunks = chunkArray(queries, 50);

    for (const batch of chunks) {
      await Promise.all(batch);
    }
  }
  console.log('Done updating dupes in local DB and removing them from applicationList to migrate');
  return appsToMigrate;
};

export const removeDupeFiles = async (conn: Connection<SmoothstackSchema>, fileList: any) => {
  // Find Dupe Applications
  const chunkFiles = chunkArray(fileList, 200);
  let dupes = [];
  for (const chunk of chunkFiles) {
    console.log('Fetching new dupe batch');
    dupes.push(
      ...(await findFilesByBhId(
        conn,
        chunk.map((c) => `${c.userWorkFileID}`)
      ))
    );
  }
  const foundDupeFiles = new Set(dupes.map((d) => +d.Bullhorn_ID__c));
  const filesToMigrate = fileList.filter((c) => !foundDupeFiles.has(c.userWorkFileID));
  console.log('Dupe Apps', dupes);
  const dupeBatches = chunkArray(dupes, 1000);
  for (const dupeBatch of dupeBatches) {
    const queries = dupeBatch.map((d) => {
      return query(`UPDATE BH_UserWorkFile SET migrated = 1 WHERE userWorkFileID = ${d.Bullhorn_ID__c}`);
    });

    const chunks = chunkArray(queries, 50);

    for (const batch of chunks) {
      await Promise.all(batch);
    }
  }
  console.log('Done updating dupes in local DB and removing them from fileList to migrate');
  return filesToMigrate;
};

const mapAppStage = (stage: string) => {
  if (['Added to Cut/Keep', 'Evaluation Passed', 'Evaluation Signed', 'In Training'].includes(stage)) {
    return 'Quick Course Signed';
  }
  if (['Incomplete Application', 'Internally Submitted', 'New Lead'].includes(stage)) {
    return 'Submitted';
  }
  if (stage === 'Evaluation Offered') {
    return 'Quick Course Offered';
  }
  if (stage === 'QC Passed') {
    return 'Tech Screen Passed';
  }
  if (stage.toLowerCase().includes('no show')) {
    return 'R-No Show';
  }
  if (['R-Eligibility', 'R-Evaluation Failed', 'R-Evaluation Period', 'R-Job Expired', 'R-SE Failed'].includes(stage)) {
    return 'R-Not a Fit';
  }
  if (['R-Offer Rejected', 'R-SE Declined'].includes(stage)) {
    return 'R-Not Interested';
  }
  if (stage === 'R-Self-Rank') {
    return 'R-Self Rank';
  }
  return stage;
};

const isNumeric = (str: string): boolean => {
  // Parse the string as a float and check if it's not NaN
  return !isNaN(parseFloat(str)) && isFinite(parseFloat(str));
};
