import { IFunction } from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"
import { EventBus, Rule } from "aws-cdk-lib/aws-events"
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets"

interface XyzEventBusProps {
  publisherFunction: IFunction
  targetFunction: IFunction
}

export class XyzEventBust extends Construct {
  constructor(scope: Construct, id: string, props: XyzEventBusProps) {
    super(scope, id)
    //event-bus
    const bus = new EventBus(this, "XyzEventBus", {
      eventBusName: "XyzEventBus",
    })


    //rule
    const checkoutBasketRule = new Rule(this, "CheckoutBasketRule", {
      eventBus: bus,
      enabled: true,
      description: "When Basket microservice checkout the basket",
      eventPattern: {
        source: ["com.xyz.basket.checkoutbasket"],
        detailType: ["CheckoutBasket"],
      },
      ruleName: "CheckoutBasketRule",
    })
    
    //target
    checkoutBasketRule.addTarget(new LambdaFunction(props.targetFunction))

    bus.grantPutEventsTo(props.publisherFunction)
  }
}
