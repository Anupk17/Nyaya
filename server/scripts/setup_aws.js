const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const { dynamoClient, s3Client, REGION } = require('../lib/aws');
require('dotenv').config({ path: '../.env' });

const TABLE_NAME = 'NyayaDisputes';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || `nyaya-dispute-evidence-${Date.now()}`;

async function setupDynamoDB() {
  console.log(`Checking DynamoDB table: ${TABLE_NAME}...`);
  try {
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'dispute_id', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'dispute_id', AttributeType: 'S' },
        { AttributeName: 'created_at', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'buyer_id', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: 'buyer-index',
          KeySchema: [
            { AttributeName: 'buyer_id', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    });
    
    await dynamoClient.send(command);
    console.log(`✅ Created DynamoDB table: ${TABLE_NAME}`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️ DynamoDB table ${TABLE_NAME} already exists.`);
    } else {
      console.error('❌ Error creating DynamoDB table:', error);
    }
  }
}

async function setupS3() {
  console.log(`Checking S3 bucket: ${BUCKET_NAME}...`);
  try {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`ℹ️ S3 bucket ${BUCKET_NAME} already exists.`);
    } catch (headErr) {
      if (headErr.$metadata?.httpStatusCode === 404) {
        console.log(`Creating S3 bucket: ${BUCKET_NAME}...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Created S3 bucket: ${BUCKET_NAME}`);
      } else {
        throw headErr;
      }
    }

    // Set CORS so the frontend can upload directly
    console.log(`Configuring CORS for ${BUCKET_NAME}...`);
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST'],
            AllowedOrigins: ['*'], // In production, restrict to frontend domain
            ExposeHeaders: [],
            MaxAgeSeconds: 3000
          }
        ]
      }
    }));
    console.log(`✅ Configured CORS for S3 bucket: ${BUCKET_NAME}`);
    console.log(`\nIMPORTANT: Add this to your server/.env file:\nS3_BUCKET_NAME=${BUCKET_NAME}\n`);
  } catch (error) {
    console.error('❌ Error configuring S3:', error);
  }
}

async function main() {
  console.log('--- Starting AWS Setup ---');
  await setupDynamoDB();
  await setupS3();
  console.log('--- AWS Setup Complete ---');
}

main();
