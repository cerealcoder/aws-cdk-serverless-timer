import * as path from 'path';
import * as Apigateway from '@aws-cdk/aws-apigateway';
import * as Dynamodb from '@aws-cdk/aws-dynamodb';
import * as Events from '@aws-cdk/aws-events';
import * as Iam from '@aws-cdk/aws-iam';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as Sqs from '@aws-cdk/aws-sqs';
import * as Cdk from '@aws-cdk/core';


//import * as EventsTargets from '@aws-cdk/aws-events-targets';
const defaultLambdaCode = `
'use strict';
const util = require('util');
console.log('Loading function');
exports.handler = async (event) => {
  console.log(util.inspect(event, false, 5));
  return true;
}
`;


/**
 * @summary The properties for  ServerlessPeriodicTimer Construct
 */
export interface ServerlessPeriodicTimerProps {
  /**
   * Existing instance of Lambda Function object, if this is set then the lambdaFunctionProps is ignored.
   *
   * @default - None
   */
  readonly existingLambdaObj?: Lambda.Function;
  /**
   * User provided props to override the default props for the Lambda function.
   *
   * @default - Default props are used
   */
  readonly lambdaFunctionProps?: Lambda.FunctionProps;
  /**
   * User provided eventRuleProps to override the defaults
   *
   * @default - None
   */
  readonly eventRuleProps: Events.RuleProps;
}

export class ServerlessPeriodicTimer extends Cdk.Construct {
  lambdaFunction: Lambda.Function;
  eventsRule: Events.Rule;
  table: Dynamodb.Table;
  queue: Sqs.Queue;
  restApi: Apigateway.RestApi;
  apiPutLambdaFunction: Lambda.Function;
  apiGetLambdaFunction: Lambda.Function;
  apiDeleteLambdaFunction: Lambda.Function;
  apiOptionsLambdaFunction: Lambda.Function;

  constructor(scope: Cdk.Construct, id: string, props?: ServerlessPeriodicTimerProps) {
    super(scope, id);

    // @see https://stackoverflow.com/questions/13613524/get-an-objects-class-name-at-runtime
    // const typeName = 'ServerlessPeriodicTimer';
    console.log(props);

    //
    // Set up a DynamoDb table that contains our timer wheel
    // The partition key is a shard identifier that should map 1:1 with the Cloudwatch timer event source
    // The sortKey is a timer shard (e.g. minute of hour), numbers padded for UTF8 sorting, with the unique periodic
    // timer ID appended to the timer shard
    //
    const partitionKeyName = 'shardId';
    const sortKeyName = 'timeShardId';
    this.table = new Dynamodb.Table(this, id + 'Table', {
      partitionKey: {
        name: partitionKeyName,
        type: Dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: sortKeyName,
        type: Dynamodb.AttributeType.STRING,
      },
    });

    //
    // Set up an SQS queue where we will send messages
    //
    this.queue = new Sqs.Queue(this, id + 'Queue', {
      queueName: id + 'Queue' + '.fifo',
      contentBasedDeduplication: true,
    });

    //
    // Set up an API gateway and associated Lambda function that sets up or destroys timer entries
    // the REST API will look like this:
    //
    // PUT /periodic-timer/<id> : BODY { version: <Integer>, shardId: <string>, interval: < hourly | daily >, data: <JSON string> }
    // GET /periodic-timer/<id> : returns what was PUT as well as last invocation time
    // DELETE /periodic-timer/<id> : delete the timer entry.  Due to races one SQS message still could appear after deletion
    //
    // the contents of BODY are what is put into the SQS message
    //

    this.apiGetLambdaFunction = new Lambda.Function(scope, id + 'ApiGetLambdaFunction', {
      runtime: Lambda.Runtime.NODEJS_12_X,
      //code: Lambda.Code.fromAsset(`${__dirname}/lambda`)
      //code: Lambda.Code.fromInline(defaultApiLambdaCode),
      code: Lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        TABLE_NAME: this.table.tableName,
        PRIMARY_KEY: partitionKeyName,
        SORT_KEY: sortKeyName,
      },
      handler: 'get.handler',
    });
    this.table.grantReadWriteData(this.apiGetLambdaFunction);
    this.apiPutLambdaFunction = new Lambda.Function(scope, id + 'ApiPutLambdaFunction', {
      runtime: Lambda.Runtime.NODEJS_12_X,
      //code: Lambda.Code.fromAsset(`${__dirname}/lambda`)
      //code: Lambda.Code.fromInline(defaultApiLambdaCode),
      code: Lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        TABLE_NAME: this.table.tableName,
        PRIMARY_KEY: partitionKeyName,
        SORT_KEY: sortKeyName,
      },
      handler: 'put.handler',
    });
    this.table.grantReadWriteData(this.apiPutLambdaFunction);
    this.apiDeleteLambdaFunction = new Lambda.Function(scope, id + 'ApiDeleteLambdaFunction', {
      runtime: Lambda.Runtime.NODEJS_12_X,
      //code: Lambda.Code.fromAsset(`${__dirname}/lambda`)
      //code: Lambda.Code.fromInline(defaultApiLambdaCode),
      code: Lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        TABLE_NAME: this.table.tableName,
        PRIMARY_KEY: partitionKeyName,
        SORT_KEY: sortKeyName,
      },
      handler: 'delete.handler',
    });
    this.table.grantReadWriteData(this.apiDeleteLambdaFunction);
    this.apiOptionsLambdaFunction = new Lambda.Function(scope, id + 'ApiOptionsLambdaFunction', {
      runtime: Lambda.Runtime.NODEJS_12_X,
      //code: Lambda.Code.fromAsset(`${__dirname}/lambda`)
      //code: Lambda.Code.fromInline(defaultApiLambdaCode),
      code: Lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        TABLE_NAME: this.table.tableName,
        PRIMARY_KEY: partitionKeyName,
        SORT_KEY: sortKeyName,
      },
      handler: 'options.handler',
    });
    this.restApi = new Apigateway.RestApi(this, id + 'Restapi');
    const periodic = this.restApi.root.addResource('periodic'); // might add episodic later
    const periodicItem = periodic.addResource('{id}');
    const periodicItemIntegration = new Apigateway.LambdaIntegration(this.apiGetLambdaFunction);
    periodicItem.addMethod('GET', periodicItemIntegration);
    const periodicSetTimerIntegration = new Apigateway.LambdaIntegration(this.apiPutLambdaFunction);
    periodicItem.addMethod('PUT', periodicSetTimerIntegration);
    const periodicDelTimerIntegration = new Apigateway.LambdaIntegration(this.apiDeleteLambdaFunction);
    periodicItem.addMethod('DELETE', periodicDelTimerIntegration);
    const periodicOptionsTimerIntegration = new Apigateway.LambdaIntegration(this.apiOptionsLambdaFunction);
    periodicItem.addMethod('OPTIONS', periodicOptionsTimerIntegration);

    //
    // Set up Lambda Function that gets invoked by a periodic Cloud Watch Timer
    // The Lambda Function uses DynamoDB to generate SQS messages on the requested schedule
    //
    this.lambdaFunction = new Lambda.Function(scope, id + 'LambdaFunction', {
      runtime: Lambda.Runtime.NODEJS_12_X,
      //code: Lambda.Code.fromAsset(`${__dirname}/lambda`)
      code: Lambda.Code.fromInline(defaultLambdaCode),
      handler: 'index.handler',
    });

    const lambdaFuncTarget: Events.IRuleTarget = {
      bind: () => ({
        id: '',
        arn: this.lambdaFunction.functionArn,
      }),
    };

    this.eventsRule = new Events.Rule(this, id + 'EventsRule', {
      targets: [lambdaFuncTarget],
      schedule: Events.Schedule.rate(Cdk.Duration.minutes(1)),
    });

    //
    // hook permissions up to all the elements
    //
    this.lambdaFunction.addPermission(id + 'LambdaInvokePermission', {
      principal: new Iam.ServicePrincipal('events.amazonaws.com') as Iam.IPrincipal,
      sourceArn: this.eventsRule.ruleArn,
    });
    this.table.grantReadWriteData(this.lambdaFunction);
  }

}
