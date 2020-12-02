'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const util = require('util');
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const SECOND_INDEX_KEY_NAME = process.env.SECOND_INDEX_KEY_NAME;
const SECOND_INDEX = process.env.SECOND_INDEX;
const SECOND_INDEX_SORT_KEY = process.env.SECOND_INDEX_SORT_KEY;
const QUEUE_URL = process.env.QUEUE_URL;

console.log('Loading function');
exports.handler = async (event) => {
  console.log(util.inspect(event, false, 5));
  
  if (!TABLE_NAME) {
    return { statusCode: 400, body: 'environment variable TABLE_NAME not set' };
  }
  if (!PRIMARY_KEY) {
    return { statusCode: 400, body: 'environment variable PRIMARY_KEY not set' };
  }
  if (!SECOND_INDEX_KEY_NAME) {
    return { statusCode: 400, body: 'environment variable SECOND_INDEX_KEY_NAME not set' };
  }
  if (!SECOND_INDEX_SORT_KEY) {
    return { statusCode: 400, body: 'environment variable SECOND_INDEX_SORT_KEY not set' };
  }
  
  const date = new Date();
  const minute = date.getMinutes();
  const minuteString = minute.toString().padStart(2, 0);
  const ddbParams = {
    TableName: TABLE_NAME,
    IndexName: SECOND_INDEX,
    KeyConditionExpression: `${SECOND_INDEX_KEY_NAME} = :ShardId and begins_with(${SECOND_INDEX_SORT_KEY}, :Minute)`,
    ExpressionAttributeValues: {
      ':ShardId': 'shard0',
      ':Minute': minuteString,
    }
    
  };
  console.log(util.inspect(ddbParams,false,4))
  
  try {
    const dbResult = await db.query(ddbParams).promise();
    console.log(util.inspect(dbResult,false,4))
    const enqueueResults = await Promise.all(dbResult.Items.map(async el => {
      // XXX do some sort of batching to save money
      if (!el.timerCallbackData) {
        el.timerCallbackData = { id: el.id };
      }
      const sqsParams = {
        MessageBody: JSON.stringify(el.timerCallbackData),
        QueueUrl: QUEUE_URL,
        MessageGroupId: el.id,
      };
      console.log(util.inspect(sqsParams, false, 4))
      const sqsResult = await sqs.sendMessage(sqsParams).promise();
      return sqsResult;
    }));
    console.log(util.inspect(enqueueResults, false, 4))
    
    return true;
  } catch(err) {
    console.log(util.inspect(err,false,4))
  }
}

