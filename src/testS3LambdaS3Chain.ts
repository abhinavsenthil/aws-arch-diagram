// Test file to demonstrate S3 → Lambda → S3 chaining
import { generateAllIAMPolicies, IAMPolicyContext } from './iamPolicyGenerator'

// Test case: S3 → Lambda → S3 chain
const s3LambdaS3Chain = {
  components: [
    {
      id: 's3-input',
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
      id: 's3-output',
      type: 'S3' as const,
      position: { x: 500, y: 100 },
      properties: { name: 'output-bucket' }
    }
  ],
  connections: [
    {
      from: 's3-input',
      to: 'lambda-processor',
      type: 'trigger' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    },
    {
      from: 'lambda-processor',
      to: 's3-output',
      type: 'permission' as const,
      direction: 'unidirectional' as const,
      fromPort: 'right' as const,
      toPort: 'left' as const
    }
  ]
}

// Test the IAM policy generation
export function testS3LambdaS3Chain() {
  const context: IAMPolicyContext = {
    components: s3LambdaS3Chain.components,
    connections: s3LambdaS3Chain.connections,
    existingRoles: new Set(),
    existingPolicies: new Set()
  }
  
  const policies = generateAllIAMPolicies(context)
  
  console.log('=== S3 → Lambda → S3 Chain Test ===')
  console.log('Components:', s3LambdaS3Chain.components.map(c => `${c.type}(${c.properties.name})`))
  console.log('Connections:', s3LambdaS3Chain.connections.map(c => `${c.type}: ${c.from} → ${c.to}`))
  console.log('\nGenerated IAM Policies:')
  
  policies.forEach((policy, index) => {
    console.log(`\n${index + 1}. ${policy.type}: ${policy.name}`)
    console.log(`   Description: ${policy.description}`)
    console.log(`   Properties:`)
    Object.entries(policy.properties).forEach(([key, value]) => {
      if (key === 'policy' && typeof value === 'string') {
        console.log(`     ${key}: ${value.substring(0, 100)}...`)
      } else {
        console.log(`     ${key}: ${value}`)
      }
    })
  })
  
  return policies
}

// Expected results for S3 → Lambda → S3 chain:
// 1. aws_iam_role: lambda_execution_role (Lambda execution role)
// 2. aws_lambda_permission: lambda_processor_s3_input_permission (S3 can invoke Lambda)
// 3. aws_iam_role_policy: lambda_processor_s3_access (Lambda can access S3)
// 4. aws_iam_role_policy_attachment: lambda_basic_execution (Basic Lambda permissions)
// 5. aws_s3_bucket_notification: input_bucket_lambda_trigger (S3 bucket notification)

export default s3LambdaS3Chain
