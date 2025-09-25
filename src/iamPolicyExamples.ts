// Examples demonstrating the new IAM policy system
// This file shows how the system correctly handles different AWS service interactions

import { generateAllIAMPolicies, IAMPolicyContext } from './iamPolicyGenerator'

// Example 1: S3 → Lambda (S3 triggers Lambda)
export const s3ToLambdaExample = {
  components: [
    {
      id: 's3-bucket-1',
      type: 'S3' as const,
      position: { x: 100, y: 100 },
      properties: { name: 'my-bucket' }
    },
    {
      id: 'lambda-function-1',
      type: 'Lambda' as const,
      position: { x: 300, y: 100 },
      properties: { name: 'my-function' }
    }
  ],
  connections: [
    {
      from: 's3-bucket-1',
      to: 'lambda-function-1',
      type: 'trigger' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Example 2: Lambda → S3 (Lambda accesses S3)
export const lambdaToS3Example = {
  components: [
    {
      id: 'lambda-function-2',
      type: 'Lambda' as const,
      position: { x: 100, y: 100 },
      properties: { name: 'data-processor' }
    },
    {
      id: 's3-bucket-2',
      type: 'S3' as const,
      position: { x: 300, y: 100 },
      properties: { name: 'data-storage' }
    }
  ],
  connections: [
    {
      from: 'lambda-function-2',
      to: 's3-bucket-2',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Example 3: S3 → Lambda → S3 (S3 triggers Lambda, Lambda processes and stores to another S3)
export const s3ToLambdaToS3Example = {
  components: [
    {
      id: 's3-bucket-input',
      type: 'S3' as const,
      position: { x: 100, y: 100 },
      properties: { name: 'input-bucket' }
    },
    {
      id: 'lambda-processor',
      type: 'Lambda' as const,
      position: { x: 300, y: 100 },
      properties: { name: 'image-processor' }
    },
    {
      id: 's3-bucket-output',
      type: 'S3' as const,
      position: { x: 500, y: 100 },
      properties: { name: 'output-bucket' }
    }
  ],
  connections: [
    {
      from: 's3-bucket-input',
      to: 'lambda-processor',
      type: 'trigger' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    },
    {
      from: 'lambda-processor',
      to: 's3-bucket-output',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Example 4: API Gateway → Lambda → DynamoDB
export const apiGatewayToLambdaToDynamoDBExample = {
  components: [
    {
      id: 'api-gateway-1',
      type: 'API Gateway' as const,
      position: { x: 100, y: 100 },
      properties: { name: 'my-api' }
    },
    {
      id: 'lambda-function-3',
      type: 'Lambda' as const,
      position: { x: 300, y: 100 },
      properties: { name: 'api-handler' }
    },
    {
      id: 'dynamodb-table-1',
      type: 'DynamoDB' as const,
      position: { x: 500, y: 100 },
      properties: { name: 'user-data' }
    }
  ],
  connections: [
    {
      from: 'api-gateway-1',
      to: 'lambda-function-3',
      type: 'trigger' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    },
    {
      from: 'lambda-function-3',
      to: 'dynamodb-table-1',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Example 5: Complex architecture with multiple services
export const complexArchitectureExample = {
  components: [
    {
      id: 's3-bucket-3',
      type: 'S3' as const,
      position: { x: 100, y: 100 },
      properties: { name: 'uploads' }
    },
    {
      id: 'lambda-function-4',
      type: 'Lambda' as const,
      position: { x: 300, y: 100 },
      properties: { name: 'image-processor' }
    },
    {
      id: 'sns-topic-1',
      type: 'SNS' as const,
      position: { x: 500, y: 100 },
      properties: { name: 'notifications' }
    },
    {
      id: 'sqs-queue-1',
      type: 'SQS' as const,
      position: { x: 700, y: 100 },
      properties: { name: 'processing-queue' }
    }
  ],
  connections: [
    {
      from: 's3-bucket-3',
      to: 'lambda-function-4',
      type: 'trigger' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    },
    {
      from: 'lambda-function-4',
      to: 'sns-topic-1',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    },
    {
      from: 'lambda-function-4',
      to: 'sqs-queue-1',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Function to demonstrate IAM policy generation
export function demonstrateIAMPolicies(example: any) {
  const context: IAMPolicyContext = {
    components: example.components,
    connections: example.connections,
    existingRoles: new Set(),
    existingPolicies: new Set()
  }
  
  const policies = generateAllIAMPolicies(context)
  
  console.log('Generated IAM Policies:')
  policies.forEach(policy => {
    console.log(`- ${policy.type}: ${policy.name}`)
    console.log(`  Description: ${policy.description}`)
    console.log(`  Properties:`, policy.properties)
    console.log('')
  })
  
  return policies
}

// Export all examples for testing
export const allExamples = [
  s3ToLambdaExample,
  lambdaToS3Example,
  s3ToLambdaToS3Example,
  apiGatewayToLambdaToDynamoDBExample,
  complexArchitectureExample
]