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
  basketTable: ITable
  orderTable: ITable
}
export class XyzMicroservices extends Construct {
  public readonly productMicroservice: NodejsFunction
  public readonly basketMicroservice: NodejsFunction
  public readonly orderMicroservice: NodejsFunction


  constructor(scope: Construct, id: string, props: XyzMicroservicesProps) {
    super(scope, id)

    this.productMicroservice = this.createProductLambdaFunction(
      props.productTable
    )
    this.basketMicroservice = this.createBasketLambdaFunction(props.basketTable)

    this.orderMicroservice = this.createOrderingLambdaFunction(props.orderTable)
  }

  private createProductLambdaFunction(productTable: ITable): NodejsFunction {
    //external-modules: to be present when running this fn
    const productFnProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    //product microservice lambda function
    const productFunction = new NodejsFunction(this, "product", {
      entry: join(__dirname, `/../src/product/index.js`),
      ...productFnProps,
    })
    //grant lambda fn permissions to mutate dynamoDB
    productTable.grantReadWriteData(productFunction)

    return productFunction
  }

  private createBasketLambdaFunction(basketTable: ITable): NodejsFunction {
    const basketFnProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "userName",
        DYNAMODB_TABLE_NAME: basketTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    //basket microservice lambda function
    const basketFunction = new NodejsFunction(this, "basket", {
      entry: join(__dirname, `/../src/basket/index.js`),
      ...basketFnProps,
    })
    //grant lambda fn permissions to mutate dynamoDB
    basketTable.grantReadWriteData(basketFunction)

    return basketFunction
  }

  private createOrderingLambdaFunction(orderTable: ITable) : NodejsFunction {
    const nodeJsFunctionProps: NodejsFunctionProps = {
        bundling: {
            externalModules: [
                'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
            ],
        },      
        environment: {
            PRIMARY_KEY: 'userName',
            SORT_KEY: 'orderDate',
            DYNAMODB_TABLE_NAME: orderTable.tableName,
        },
        runtime: Runtime.NODEJS_14_X,
    }

    const orderFunction = new NodejsFunction(this, 'orderingLambdaFunction', {
        entry: join(__dirname, `/../src/ordering/index.js`),
        ...nodeJsFunctionProps,
    });

    orderTable.grantReadWriteData(orderFunction);
    return orderFunction;
  }
}
