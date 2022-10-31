

import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface XyzQueueProps {
    consumer: IFunction;
}

export class XyzQueue extends Construct {

    public readonly orderQueue: IQueue;

    constructor(scope: Construct, id: string, props: XyzQueueProps) {
        super(scope, id);

      //queue
      this.orderQueue = new Queue(this, 'OrderQueue', {
        queueName : 'OrderQueue',
        visibilityTimeout: Duration.seconds(30) // default value
      });
      // following example adds an SQS Queue as an event source to a lambda function
      //lambda event source mapping invocation
      props.consumer.addEventSource(new SqsEventSource(this.orderQueue, {
          batchSize: 1
      }));
    }
}