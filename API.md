# API Reference

**Classes**

Name|Description
----|-----------
[ServerlessPeriodicTimer](#umlss-aws-cdk-serverless-timer-serverlessperiodictimer)|*No description*


**Structs**

Name|Description
----|-----------
[ServerlessPeriodicTimerProps](#umlss-aws-cdk-serverless-timer-serverlessperiodictimerprops)|*No description*



## class ServerlessPeriodicTimer  <a id="umlss-aws-cdk-serverless-timer-serverlessperiodictimer"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new ServerlessPeriodicTimer(scope: Construct, id: string, props?: ServerlessPeriodicTimerProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ServerlessPeriodicTimerProps](#umlss-aws-cdk-serverless-timer-serverlessperiodictimerprops)</code>)  *No description*
  * **eventRuleProps** (<code>[RuleProps](#aws-cdk-aws-events-ruleprops)</code>)  User provided eventRuleProps to override the defaults. 
  * **existingLambdaObj** (<code>[Function](#aws-cdk-aws-lambda-function)</code>)  Existing instance of Lambda Function object, if this is set then the lambdaFunctionProps is ignored. __*Default*__: None
  * **lambdaFunctionProps** (<code>[FunctionProps](#aws-cdk-aws-lambda-functionprops)</code>)  User provided props to override the default props for the Lambda function. __*Default*__: Default props are used



### Properties


Name | Type | Description 
-----|------|-------------
**apiDeleteLambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | <span></span>
**apiGetLambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | <span></span>
**apiOptionsLambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | <span></span>
**apiPutLambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | <span></span>
**eventsRule** | <code>[Rule](#aws-cdk-aws-events-rule)</code> | <span></span>
**periodicLambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | <span></span>
**queue** | <code>[Queue](#aws-cdk-aws-sqs-queue)</code> | <span></span>
**restApi** | <code>[RestApi](#aws-cdk-aws-apigateway-restapi)</code> | <span></span>
**table** | <code>[Table](#aws-cdk-aws-dynamodb-table)</code> | <span></span>



## struct ServerlessPeriodicTimerProps  <a id="umlss-aws-cdk-serverless-timer-serverlessperiodictimerprops"></a>






Name | Type | Description 
-----|------|-------------
**eventRuleProps** | <code>[RuleProps](#aws-cdk-aws-events-ruleprops)</code> | User provided eventRuleProps to override the defaults.
**existingLambdaObj**? | <code>[Function](#aws-cdk-aws-lambda-function)</code> | Existing instance of Lambda Function object, if this is set then the lambdaFunctionProps is ignored.<br/>__*Default*__: None
**lambdaFunctionProps**? | <code>[FunctionProps](#aws-cdk-aws-lambda-functionprops)</code> | User provided props to override the default props for the Lambda function.<br/>__*Default*__: Default props are used



