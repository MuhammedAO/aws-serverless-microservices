const { PutItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb")
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb")
const { dynamoDbClient } = require("./dbClient")

exports.handler = async function (event) {
  if (event["detail-type"] !== undefined) {
    // EventBridge Invocation
    await eventBridgeInvocation(event)
  } else {
    // API Gateway Invocation -- return sync response
    return await apiGatewayInvocation(event)
  }

}

const apiGatewayInvocation = async (event) => {
  // GET /order
  // GET /order/{userName}
  let body

  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters != null) {
          body = await getOrder(event)
        } else {
          body = await getAllOrders()
        }
        break
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }

    console.log(body)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body,
      }),
    }
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation.",
        errorMsg: e.message,
        errorStack: e.stack,
      }),
    }
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

const getOrder = async (event) => {
   console.log("getOrder");
     
   try {
     // expected request : xxx/order/xyz?orderDate=timestamp
     const userName = event.pathParameters.userName;  
     const orderDate = event.queryStringParameters.orderDate; 
      //required params to access order table, composite primary key
     const params = {
       KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
       ExpressionAttributeValues: {
         ":userName": { S: userName },
         ":orderDate": { S: orderDate }
       },
       TableName: process.env.DYNAMODB_TABLE_NAME
     };
  
     const { Items } = await dynamoDbClient.send(new QueryCommand(params));
 
     console.log(Items);
     return Items.map((item) => unmarshall(item));
   } catch(e) {
     console.error(e);
     throw e;
   }
 }


 const getAllOrders = async () => {  
   console.log("getAllOrders");    
   try {
       const params = {
       TableName: process.env.DYNAMODB_TABLE_NAME
       };
   
       const { Items } = await dynamoDbClient.send(new ScanCommand(params));
 
       console.log(Items);
       return (Items) ? Items.map((item) => unmarshall(item)) : {};
 
   } catch(e) {
       console.error(e);
       throw e;
   }
 }
