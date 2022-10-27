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

