import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Construct } from 'constructs';
import { join } from 'path';



export class AwsServerlessDbsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = new Table(this, 'product', {
     partitionKey: {name: 'id', type: AttributeType.STRING},
     tableName: 'product',
     removalPolicy: RemovalPolicy.DESTROY,
     billingMode: BillingMode.PAY_PER_REQUEST
    })
    //external-modules: to be present when running this fn
    const nodeJsFnProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk'
        ]
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName
      },
      runtime: Runtime.NODEJS_14_X
    }

   //product microservice lambda function
   const productFunction = new NodejsFunction(this, 'product', {
    entry: join(__dirname, `/../src/product/index.js`),
    ...nodeJsFnProps
   })

   productTable.grantReadWriteData(productFunction)

  }
}
