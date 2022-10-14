import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb"
import { dynamoDbClient } from "./dbClient"
import { v4 as uuidv4 } from "uuid"

exports.handler = async function (event) {
  console.log("request", JSON.stringify(event, null, 2))
  console.log('pathParams', event.pathParameters)
  let body

  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.queryStringParameters != null) {
          body = await getProductsByCategory(event)
     
        } else if (event.pathParameters != null) {
          body = await getProduct(event)
        } else {
          body = await getAllProducts()
        }
        break
      case "POST":
        body = await createProduct(event)
        break
      case "DELETE":
        body = await deleteProduct(event)
        break
      case "PUT":
        body = await updateProduct(event)
        break

      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }
    console.log("body", body)
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

const getProduct = async (event) => {
  console.log("getProduct event object", event, `\n`, event.pathParameters.id )

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters.id }),
    }

    console.log('params from getProduct', params)

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

const deleteProduct = async (event) => {
  // console.log("Delete in progress", productId)
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters.id }),
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

const getProductsByCategory = async (event) => {
  console.log("getProductsByCategory")
  try {
    // GET product/1234?category=Phone
    const productId = event.pathParameters.id
    const category = event.queryStringParameters.category

    // key condition expression—a string that determines the items to be read from the table or index.
    // You must specify the partition key name and value as an equality condition.
    // the : (colon character) indicates an expression attribute value—a placeholder for an actual value.
    //Scan: scans all your rows. intensive. use only when neccessary
    //Query: specialized scanning based on the partion key & other filtering expressions

    const params = {
      KeyConditionExpression: "id = :productId",
      FilterExpression: "contains (category, :category)",
      ExpressionAttributeValues: {
        ":productId": { S: productId },
        ":category": { S: category },
      },
      TableName: process.env.DYNAMODB_TABLE_NAME,
    }

    const { Items } = await ddbClient.send(new QueryCommand(params))

    return Items.map((item) => unmarshall(item))
  } catch (error) {
    console.error(error)
    throw error
  }
}
