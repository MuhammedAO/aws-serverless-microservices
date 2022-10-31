import * as cdk from "aws-cdk-lib"
import { EventBus, Rule } from "aws-cdk-lib/aws-events"
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets"

import { Construct } from "constructs"

import { XyzApiGateway } from "./apigateway"
import { XyzDatabse } from "./database"
import { XyzEventBust } from "./event-bus"
import { XyzMicroservices } from "./microservice"
import { XyzQueue } from "./queue"

export class AwsServerlessDbsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const database = new XyzDatabse(this, "database")

    const microservices = new XyzMicroservices(this, "microsrvs", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable
    })

    const apigateway = new XyzApiGateway(this, "Apigateway", {
      productMicroservice: microservices.productMicroservice,
      basketMicroservice: microservices.basketMicroservice,
      orderMicroservice: microservices.orderMicroservice
    })

    const queue = new XyzQueue(this, 'Queue', {
      consumer: microservices.orderMicroservice
    });


    const eventbus = new XyzEventBust(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      targetQueue: queue.orderQueue
    })
    
  }
}
