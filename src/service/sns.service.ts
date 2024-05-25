import { SNS } from 'aws-sdk';
import { PublishInput } from 'aws-sdk/clients/sns';
import { getSNSConfig } from '../util/sns.util';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
} from '../model/AppointmentGenerationRequest';
import { WEBINAR_TOPIC_MAP, WEBINAR_TYPE } from './webinar.service';
import { WebinarEvent } from '../model/Webinar';
import { DocGenerationMsg, DocumentEvent } from '../model/Document';
import { DataGenerationRequest, GenerationType } from '../model/ApplicationData';
import { ConsultantGenerationRequest } from '../model/Consultant';
import { MSUser } from '../model/MSUser';
import { CohortEventProcessingRequest, CohortUserGenerationRequest } from '../model/Cohort';
import { JobEventProcessingRequest } from '../model/Job';

export const publishDataGenerationRequest = async (applicationId: string, type: GenerationType) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-data-generation-sns-topic-v2`;
  const request: DataGenerationRequest = {
    applicationId,
    type,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishAppointmentGenerationRequest = async (
  appointmentData: TechScreenAppointmentData | ChallengeAppointmentData,
  type: AppointmentType
) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-appointment-generation-sns-topic-v2`;
  const request: AppointmentGenerationRequest = {
    type,
    appointmentData,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishWebinarProcessingRequest = async (data: any) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-webinar-processing-sns-topic-v2`;
  const { id, uuid, type, topic } = data.payload.object;
  if (Object.values(WEBINAR_TOPIC_MAP).includes(topic) && type === WEBINAR_TYPE) {
    const request: WebinarEvent = {
      event: data.event,
      webinar: {
        id,
        uuid,
      },
    };
    const message: PublishInput = {
      Message: JSON.stringify(request),
      TopicArn: snsTopic,
    };

    await sns.publish(message).promise();
  }
};

export const publishDocumentGenerationRequest = async (msg: DocGenerationMsg) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-document-generation-sns-topic-v2`;
  const message: PublishInput = {
    Message: JSON.stringify(msg),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishDocumentEventProcessingRequest = async (docEvent: DocumentEvent) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-document-event-processing-sns-topic-v2`;
  const message: PublishInput = {
    Message: JSON.stringify(docEvent),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishMSUserGenerationRequest = async (applicationId: string) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-ms-user-generation-sns-topic-v2`;
  const request = {
    applicationId,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishConsultantGenerationRequest = async (applicationId: string, msUser: MSUser) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-consultant-generation-sns-topic-v2`;
  const request: ConsultantGenerationRequest = {
    applicationId,
    msUser,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishCohortUserGenerationRequest = async (applicationId: string, msUser: MSUser) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-cohort-user-generation-sns-topic-v2`;
  const request: CohortUserGenerationRequest = {
    applicationId,
    msUser,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishJobProcessingRequest = async (request: JobEventProcessingRequest) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-job-event-processing-sns-topic-v2`;
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};

export const publishCohortEventProcessingRequest = async (request: CohortEventProcessingRequest) => {
  const sns = new SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-cohort-event-processing-sns-topic-v2`;
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};
