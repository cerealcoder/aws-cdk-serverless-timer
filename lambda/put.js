const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const util = require('util');
const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const SORT_KEY = process.env.SORT_KEY || '';


const
  RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

exports.handler = async (event) => {

  console.log(util.inspect(event, false, 4));
  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  if (!event.pathParameters || !event.pathParameters.id) {
    return { statusCode: 400, body: 'invalid request, you are missing the path parameter'};
  }
  if (!TABLE_NAME) {
    return { statusCode: 400, body: 'environment variable TABLE_NAME not set' };
  }
  if (!PRIMARY_KEY) {
    return { statusCode: 400, body: 'environment variable PRIMARY_KEY not set' };
  }

  const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  if (!item[PRIMARY_KEY]) item[PRIMARY_KEY] = 'shard0';
  item[SORT_KEY] = event.pathParameters.id;
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };

  try {
    await db.put(params).promise();

    const response = {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,PUT,GET,DELETE"
      },
      body: JSON.stringify(item),
    };
    return response;
  } catch (dbError) {
    console.log(util.inspect(dbError,false,4))
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: JSON.stringify(dbError,null,2)};
  }
};


