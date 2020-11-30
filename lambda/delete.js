'use strict';
const util = require('util');

console.log('Loading function');

exports.handler = async (event) => {
  console.log(util.inspect(event,false,5));
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,PUT,GET,DELETE"
    },
    body: JSON.stringify('Hello from Lambda OPTIONS!'),
  };
  return response;
}
