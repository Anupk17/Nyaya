const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client } = require('@aws-sdk/client-s3');
const { RekognitionClient } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS Clients
const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const rekognitionClient = new RekognitionClient({ region: REGION });

const dynamoClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

module.exports = {
  bedrockClient,
  s3Client,
  rekognitionClient,
  dynamoClient,
  ddbDocClient,
  REGION
};
