const { PutItemCommand } = require("@aws-sdk/client-dynamodb")
const { marshall } = require("@aws-sdk/util-dynamodb")
const { dynamoDbClient } = require("./dbClient")

exports.handler = async function (event) {
  if (event["detail-type"] !== undefined) {
    // EventBridge Invocation
    await eventBridgeInvocation(event)
  } else {
    // API Gateway Invocation -- return sync response
   //  return await apiGatewayInvocation(event)
  }

  return {
    statusCode: 200,
    body: "Hello World!",
  }
}

const eventBridgeInvocation = async (event) => {
  console.log(`eventBridgeInvocation function. event : "${event}"`)

  // create order item into db
  await createOrder(event.detail)
}

const createOrder = async (basketCheckoutEvent) => {
  try {
    console.log(`createOrder function. event : "${basketCheckoutEvent}"`)

    // set orderDate for SK of order dynamodb
    const orderDate = new Date().toISOString()
    basketCheckoutEvent.orderDate = orderDate

    console.log(basketCheckoutEvent)

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketCheckoutEvent || {}),
    }

    const createResult = await dynamoDbClient.send(new PutItemCommand(params))
    console.log(createResult)
    return createResult
  } catch (e) {
    console.error(e)
    throw e
  }
}
