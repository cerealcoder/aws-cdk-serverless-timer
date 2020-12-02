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
  if (!SECOND_INDEX_KEY_NAME) {
    return { statusCode: 400, body: 'environment variable SECOND_INDEX_KEY_NAME not set' };
  }
  if (!SECOND_INDEX_SORT_KEY) {
    return { statusCode: 400, body: 'environment variable SECOND_INDEX_SORT_KEY not set' };
  }
  
  // time shard is minute of hour
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
  const date = new Date();
  const minute = (date.getMinutes() + 40) % 60;   // to minimize races make first poll far into future
  let minuteString = minute.toString().padStart(2, 0);

  // get passed in parameters
  const input = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  

  if ('minuteOfHour' in input) {
    minuteString = input.minuteOfHour.toString().padStart(2, 0);
  }
  const secondSortKey = `${minuteString}:${event.pathParameters.id}`;
  
  // map parameters to database parameters
  const item = {};
  item[PRIMARY_KEY] = event.pathParameters.id;
  item[SECOND_INDEX_KEY_NAME] = input[SECOND_INDEX_KEY_NAME];
  item[SECOND_INDEX_SORT_KEY] = secondSortKey;
  item.timerCallbackData = input.timerCallbackData;
  
  // defaults
  if (!item[SECOND_INDEX_KEY_NAME]) item[SECOND_INDEX_KEY_NAME] = 'shard0';
  if (!item.timerCallbackData)   item.timerCallbackData = { id: event.pathParameters.id, type: 'hourlyPeriodic' }
  
  console.log(item);
  
  const dbParams = {
    TableName: TABLE_NAME,
    Item: item
  };

  try {
    await db.put(dbParams).promise();

    const response = {
      statusCode: 200,
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
