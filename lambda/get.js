const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const util = require('util');
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const SECOND_INDEX_KEY_NAME = process.env.SECOND_INDEX_KEY_NAME;
const SECOND_INDEX_SORT_KEY = process.env.SECOND_INDEX_SORT_KEY;

const
  RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

exports.handler = async (event) => {

  console.log(util.inspect(event, false, 4));
  if (!event.pathParameters || !event.pathParameters.id) {
    return { statusCode: 400, body: 'invalid request, you are missing the path parameter'};
  }
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

  const dbParams = {
    TableName: TABLE_NAME,
    Key: {
      id: event.pathParameters.id
    }
  };
  
  try {
    const item = await db.get(dbParams).promise();
    console.log(util.inspect(item,false,4))
    
    let response;
    if (!item.Item) {
      response = {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,PUT,GET,DELETE"
        },
        body: JSON.stringify(event.pathParameters.id),
      }
    } else {
      response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,PUT,GET,DELETE"
        },
        body: JSON.stringify(item.Item),
      };
    }
		return response;
  } catch (dbError) {
    console.log(util.inspect(dbError,false,4))
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
    DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: JSON.stringify(dbError,null,2)};
  }
};
