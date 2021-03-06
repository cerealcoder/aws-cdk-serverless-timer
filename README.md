# AWS Serverless Periodic Timer
The purpose of this AWS CDK Construct is to allow one to deploy a scaleable periodic timer
that invokes scaleable a Lambda function.  The timer service is controlled by an API Gateway REST API.

The deployment looks like this


        Client -IAM-> APIGateway --> Lambda API Handler --> DynamoDB timer table
                                                                ^
                                                                |
        Cloudwatch Cron Event -> Lambda Timer Handler -----------
                                          |
                                          | 
                                         SQS--> Lambda Function "callback"
                                    

Inspiration came from [this article](https://theburningmonk.com/2019/05/using-cloudwatch-and-lambda-to-implement-ad-hoc-scheduling/).

The same concept exists in most operating systems, for example Windows and Linux, or Javascript's 
`setInterval(function, milliseconds, param1, param2, ...)` function.   This Construct allows you do the same 
type of periodic timer with context data serverless, at scale.  Typically you will have to worry about 
overwhelming whatever system you are polling, not whether this Construct can handle enough timers.

A future version will additionally support one shot timers, which is what is the Burning Monk article specifically
addresses.

## API
the API is implemented as an API Gateway RESTful API.   The operations supported are `PUT`,
`GET`, and `DELETE`.   The unique key is always supplied the by client.

The URL is generated by CFT and API Gateway, but looks something like this:

    https://623x7chr64.execute-api.us-east-1.amazonaws.com/prod/periodic/<id> 

where `<id>` is a unique identifer you use in your system.  (e.g. a UUID representing a user, object, or whatever).

### API `PUT`
the body of a `PUT` takes a JSON document that looks like this:

     timerCallbackData: {
       // whatever data you want
     }

The data you specify is what you will as the message body of your SQS Lambda handler that gets
invoked by SQS.  It can be whatever you wish.  Typically you'll want to include the same unique
identifer as above, a version field, and some sort of context that identifies the work you wish to perform. 

For example:

     timerCallbackData: {
       version: 1
       id: 'fee5f544-af54-4ec3-9631-32f0d8d88309',
       worktype: "poll a third party API"
     }

the PUT will return a JSON object that looks something like this:

    {
      id: 'fee5f544-af54-4ec3-9631-32f0d8d88309',
      shardId: 'shard0',
      timeShardId: '45:fee5f544-af54-4ec3-9631-32f0d8d88309',
      timerCallbackData: {
        version: 1
        id: 'fee5f544-af54-4ec3-9631-32f0d8d88309',
        worktype: "poll a third party API"
      } 
    } 

## API `GET`
A `GET` on the URL will return a JSON object that looks like this:

    {
      id: 'fee5f544-af54-4ec3-9631-32f0d8d88309',
      shardId: 'shard0',
      timeShardId: '45:fee5f544-af54-4ec3-9631-32f0d8d88309',
      timerCallbackData: {
        version: 1
        id: 'fee5f544-af54-4ec3-9631-32f0d8d88309',
        worktype: "poll a third party API"
      } 
    } 

Note the shardId is a future scale out feature to be added. It is undecided whether the client
has control of the shard or whether sharding will be automatic.

## API `DELETE`
a `DELETE` on the URL will delete the timer from the database.  It is possible for a timer to fire
after the DELETE due to the asynchronous nature of distributed systems..

The `DELETE` will return the JSON formatted unique ID that was deleted.

## Scaling considerations
The scaling works because

1. SQS Lambda handlers naturally scale out
1. A single Lambda function invoked by the Cloudwatch Cron Timer can create a lot of
   SQS messages in one minute if written correctly
1. The cloudwatch cron event and its associated handler will in a future version be able
   to add shards - up to 100 per account. 


There is an assumption that reading dynamodb and enqueuing an SQS event takes less time
than whatever work the Lambda timer "callback" is doing.  If this is not true, scaling
will be limited.


# Development

THis project uses [projen](https://github.com/projen/projen) and thus you should not 
edit `package.json` and other such files directly.   See the `projen` documentation 
for instructions.  Most common tasks are of the `yarn run task` variety.

## Interactive development using Docker
a `docker-compose.yml` is available for development.  To run interactive development:

    docker-cdompose run code /bin/bash

## Testing
`yarn run test` in interactive mode.

The unit test is very limited, just makes sure that CDK will successfully synthesize a CFT
template.  See the corresponding repo `aws-cdk-serverless-timer-test` for full integration
tests.
