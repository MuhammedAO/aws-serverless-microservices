import * as cdk from "aws-cdk-lib"

import { Construct } from "constructs"

import { XyzApiGateway } from "./apigateway"
import { XyzDatabse } from "./database"
import { XyzMicroservices } from "./microservice"

export class AwsServerlessDbsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const database = new XyzDatabse(this, "database")

    const microservices = new XyzMicroservices(this, "microsrvs", {
      productTable: database.productTable,
      basketTable: database.basketTable
    })

    const apigateway = new XyzApiGateway(this, "Apigateway", {
      productMicroservice: microservices.productMicroservice,
    })
  }
}
