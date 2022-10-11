import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"
import { join } from "path"

interface XyzMicroservicesProps {
  productTable: ITable
}
export class XyzMicroservices extends Construct {
  public readonly productMicroservice: NodejsFunction

  constructor(scope: Construct, id: string, props: XyzMicroservicesProps) {
    super(scope, id)

    //external-modules: to be present when running this fn
    const nodeJsFnProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: props.productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    //product microservice lambda function
    const productFunction = new NodejsFunction(this, "product", {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsFnProps,
    })
    //grant lambda fn permissions to mutate dynamoDB
    props.productTable.grantReadWriteData(productFunction)

    this.productMicroservice = productFunction
  }
}
