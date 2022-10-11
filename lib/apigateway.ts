import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway"
import { IFunction } from "aws-cdk-lib/aws-lambda"

import { Construct } from "constructs"

interface XyzApiGatewayProps {
  productMicroservice: IFunction
}

export class XyzApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: XyzApiGatewayProps) {
    super(scope, id)

    //Product microservice api-gateway
    //root name = product

    const apiGW = new LambdaRestApi(this, "productApi", {
      restApiName: "product service",
      handler: props.productMicroservice,
      proxy: false,
    })

    const product = apiGW.root.addResource("product")
    product.addMethod("GET") //GET /product
    product.addMethod("POST") //POST /product

    const singleProduct = product.addResource("{id}") //product/{id}
    singleProduct.addMethod("GET") //GET /product/{id}
    singleProduct.addMethod("PUT") //PUT /product/{id}
    singleProduct.addMethod("DELETE") //DELETE /product/{id}
  }
}
