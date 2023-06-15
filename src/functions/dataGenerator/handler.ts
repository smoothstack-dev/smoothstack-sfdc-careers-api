import { SNSEvent } from 'aws-lambda';
import { generateData } from '../../service/dataGenerator.service';

const dataGenerator = async (event: SNSEvent) => {
  try {
    await generateData(event);
  } catch (e) {
    console.error('Error generating data for application: ', e);
    throw e;
  }
};

export const main = dataGenerator;
