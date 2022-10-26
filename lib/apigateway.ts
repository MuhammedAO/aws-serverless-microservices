import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway"
import { IFunction } from "aws-cdk-lib/aws-lambda"

import { Construct } from "constructs"

interface XyzApiGatewayProps {
  productMicroservice: IFunction
  basketMicroservice: IFunction
  orderMicroservice: IFunction
}

export class XyzApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: XyzApiGatewayProps) {
    super(scope, id)

    this.createProductApi(props.productMicroservice)
    this.createBasketApi(props.basketMicroservice)
    this.createOrderApi(props.orderMicroservice)
  }

  private createProductApi(productMicroservice: IFunction) {
    //Product microservice api-gateway
    //root name = product
    const productApiGw = new LambdaRestApi(this, "productApi", {
      restApiName: "product service",
      handler: productMicroservice,
      proxy: false,
    })

    const product = productApiGw.root.addResource("product")
    product.addMethod("GET") //GET /product
    product.addMethod("POST") //POST /product

    const singleProduct = product.addResource("{id}") //product/{id}
    singleProduct.addMethod("GET") //GET /product/{id}
    singleProduct.addMethod("PUT") //PUT /product/{id}
    singleProduct.addMethod("DELETE") //DELETE /product/{id}
  }

  private createBasketApi(basketMicroservice: IFunction) {
    // Basket microservices api gateway
    // root name = basket
    const basketApiGw = new LambdaRestApi(this, "basketApi", {
      restApiName: "basket service",
      handler: basketMicroservice,
      proxy: false,
    })
    const basket = basketApiGw.root.addResource("basket")
    basket.addMethod("GET") // GET /basket
    basket.addMethod("POST") // POST /basket

    const singleBasket = basket.addResource("{userName}")
    singleBasket.addMethod("GET") // GET /basket/{userName}
    singleBasket.addMethod("DELETE") // DELETE /basket/{userName}

    const basketCheckout = basket.addResource('checkout')
    basketCheckout.addMethod('POST')   //POST /basket/checkout //expected payload {username: xyz}
  }

  private createOrderApi(orderingMicroservices: IFunction) {
    // Ordering microservices api gateway
    // root name = order

    // GET /order
    // GET /order/{userName}
    // expected request : xxx/order/swn?orderDate=timestamp
    // ordering ms grap input and query parameters and filter to dynamo db

    const OrderApiGw = new LambdaRestApi(this, "orderApi", {
      restApiName: "Order Service",
      handler: orderingMicroservices,
      proxy: false,
    })

    const order = OrderApiGw.root.addResource("order")
    order.addMethod("GET") // GET /order

    const singleOrder = order.addResource("{userName}")
    singleOrder.addMethod("GET") // GET /order/{userName}
    // expected request : xxx/order/swn?orderDate=timestamp
    // ordering ms grap input and query parameters and filter to dynamo db

    return singleOrder

  }
}
