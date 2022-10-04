import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb"
import { dynamoDbClient } from "./dbClient"
import { uuid as uuidv4 } from "uuid"

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
    case "DELETE":
      body = await deleteProduct(event.pathParameters.id)
      break
    case "PUT":
      body = await updateProduct(event)
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
    const productRequest = JSON.parse(event.body)

    //set productId
    const productId = uuidv4()
    productRequest.id = productId

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(productRequest || {}),
    }

    const result = await dynamoDbClient.send(new PutItemCommand(params))
    console.log("createResult", result)
    return result
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const deleteProduct = async (productId) => {
  console.log("Delete in progress", productId)
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      key: marshall({ id: productId }),
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

const updateProduct = async (event) => {
  try {
    const requestBody = JSON.parse(event.body)
    const objKeys = Object.keys(requestBody)

    console.log("Updating product", requestBody, objKeys)

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters.id }),
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        )
      ),
    }

    const updateResult = await dynamoDbClient.send(
      new UpdateItemCommand(params)
    )

    console.log("update result", updateResult)
    return updateResult
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}
