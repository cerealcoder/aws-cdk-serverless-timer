'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const util = require('util');
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const SECOND_INDEX_KEY_NAME = process.env.SECOND_INDEX_KEY_NAME;
const SECOND_INDEX_SORT_KEY = process.env.SECOND_INDEX_SORT_KEY;

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
    IndexName: '',
    KeyConditionExpression: `${SECOND_INDEX_KEY_NAME} = :ShardId and begins_with(${SECOND_INDEX_SORT_KEY}, :Minute)`,
    ExpressionAttributeValues: {
      ':ShardId': 'Shard0',
      ':Minute': minuteString,
    }
    
  };
  
  try {
    const items = await db.query(ddbParams).promise();
    console.log(util.inspect(items,false,4))
    return true;
  } catch(err) {
    console.log(util.inspect(err,false,4))
  }
}

