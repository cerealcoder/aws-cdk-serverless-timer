# AWS Serverless Periodic Timer
The purpose of this AWS CDK Construct is to allow one to deploy a scaleable periodic timer
that invokes a Lambda function.  The timer "wheel" is controlled by an API Gateway REST API.

The deployment looks like this


        Client -IAM-> APIGateway --> Lambda API Handler --> DynamoDB timer table
                                                                ^
                                                                |
        Cloudwatch Cron Event -> Lambda Timer Handler -----------
                                          |
                                          | 
                                         SQS--> Lambda Function "callback"
                                    

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
