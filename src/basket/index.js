const { dynamoDbClient } = require("./dbClient")
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb"

exports.handler = async function (event) {
  console.log("basker request", JSON.stringify(event, null, 2))

  let body
  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.queryStringParameters != null) {
          body = await getBasket(event.pathParameters.userName)
        } else {
          body = await getAllBaskets()
        }
        break
      case "POST":
        if (event.path == "/basket/checkout") {
          body = await checkoutBasket(event)
        } else {
          body = await createBasket(event)
        }
        break
      case "DELETE":
        body = await deleteBasket(event.pathParameters.userName)
        break
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body,
      }),
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `failed to perform operation`,
        errorMsg: error.stack,
        errorStack: error.stack,
      }),
    }
  }
}

const getBasket = async (userName) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName }),
    }

    const { Item } = await dynamoDbClient.send(new GetItemCommand(params))

    console.log("item", Item)
    return Item ? unmarshall(Item) : {}
  } catch (error) {
    console.log('getBasketError',error)
    throw new Error(error)
  }
}

const getAllBaskets = async () => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    }

    const { Items } = await dynamoDbClient.send(new ScanCommand(params))

    console.log("items", Items)

    return Items ? Items.map((item) => unmarshall(item)) : {}
  } catch (error) {
    console.log('getAllBaskets error',error)
    throw new Error(error)
  }
}

const createBasket = async (event) => {
  try {
    const basketRequest = JSON.parse(event.body)

    // //set productId
    // const productId = uuidv4()
    // productRequest.id = productId

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketRequest || {}),
    }

    const result = await dynamoDbClient.send(new PutItemCommand(params))

    console.log("createBasketResult", result)

    return result
  } catch (error) {
    console.log('createBasketError',error)
    throw new Error(error)
  }
}

const deleteBasket = async (userName) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName }),
    }

    const deleteResult = await dynamoDbClient.send(
      new DeleteItemCommand(params)
    )
    console.log("delete result", deleteResult)
    return deleteResult
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}
const checkoutBasket = async () => {}
