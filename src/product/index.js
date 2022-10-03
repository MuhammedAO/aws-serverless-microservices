import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb"
import { dynamoDbClient } from "./dbClient"

exports.handler = async function (event) {
  console.log("request", JSON.stringify(event, null, 2))
  let body
  switch (event.httpMethod) {
    case "GET":
      if (event.pathParameters !== null) {
        body = await getProduct(event.pathParameters.id)
      } else {
        body = await getAllProducts()
      }
    case "POST":
      body = await createProduct(event)
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
}

const getProduct = async (productId) => {
  console.log("getProduct")

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      key: marshall({ id: productId }),
    }

    const { Item } = await dynamoDbClient.send(new GetItemCommand(params))

    console.log("item", Item)
    return Item ? unmarshall(Item) : {}
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const getAllProducts = async () => {
  console.log("allProducts")
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    }

    const { Items } = await dynamoDbClient.send(new ScanCommand(params))

    console.log("items", Items)

    return Items ? Items.map((item) => unmarshall(item)) : {}
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const createProduct = async (event) => {
  console.log(`createProduct, event: ${event}`)

  try {
    const reqBody = JSON.parse(event.body)

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(reqBody || {}),
    }

    const result = await dynamoDbClient.send(new PutItemCommand(params))
    console.log("createResult", result)
    return result
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}
