// Comprehensive IAM policy mapping for AWS resource relationships
// This file defines how different AWS services interact and what IAM policies are needed

export interface IAMPolicyRequirement {
  policyType: 'resource-based' | 'execution-role' | 'both'
  sourceService: string
  targetService: string
  actions: string[]
  resources: string[]
  conditions?: Record<string, any>
  description: string
}

export interface ServiceCapability {
  canInvoke: string[]  // Services this can invoke
  canBeInvokedBy: string[]  // Services that can invoke this
  canAccess: string[]  // Services this can access
  canBeAccessedBy: string[]  // Services that can access this
}

// Define what each AWS service can do
export const SERVICE_CAPABILITIES: Record<string, ServiceCapability> = {
  'S3': {
    canInvoke: ['Lambda', 'SNS', 'SQS'],
    canBeInvokedBy: ['Lambda', 'EC2', 'ECS', 'EKS'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'EC2', 'ECS', 'EKS', 'CloudFront', 'API Gateway']
  },
  'Lambda': {
    canInvoke: ['S3', 'DynamoDB', 'RDS', 'SNS', 'SQS', 'SES', 'API Gateway'],
    canBeInvokedBy: ['S3', 'API Gateway', 'SNS', 'SQS', 'CloudWatch Events', 'CloudFront'],
    canAccess: ['S3', 'DynamoDB', 'RDS', 'SNS', 'SQS', 'SES', 'CloudWatch'],
    canBeAccessedBy: ['S3', 'API Gateway', 'SNS', 'SQS']
  },
  'API Gateway': {
    canInvoke: ['Lambda', 'EC2', 'S3'],
    canBeInvokedBy: ['CloudFront', 'Route53'],
    canAccess: ['Lambda', 'S3'],
    canBeAccessedBy: ['CloudFront', 'Route53']
  },
  'DynamoDB': {
    canInvoke: [],
    canBeInvokedBy: ['Lambda', 'EC2', 'ECS', 'EKS'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'EC2', 'ECS', 'EKS', 'API Gateway']
  },
  'RDS': {
    canInvoke: [],
    canBeInvokedBy: ['Lambda', 'EC2', 'ECS', 'EKS'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'EC2', 'ECS', 'EKS']
  },
  'SNS': {
    canInvoke: ['Lambda', 'SQS', 'SES'],
    canBeInvokedBy: ['Lambda', 'S3', 'CloudWatch Events'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'S3', 'CloudWatch Events']
  },
  'SQS': {
    canInvoke: ['Lambda'],
    canBeInvokedBy: ['Lambda', 'SNS', 'S3'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'SNS', 'S3']
  },
  'CloudWatch': {
    canInvoke: ['Lambda', 'SNS'],
    canBeInvokedBy: ['Lambda', 'EC2', 'ECS', 'EKS'],
    canAccess: [],
    canBeAccessedBy: ['Lambda', 'EC2', 'ECS', 'EKS']
  }
}

// Define specific IAM policy requirements for each service interaction
export const IAM_POLICY_REQUIREMENTS: IAMPolicyRequirement[] = [
  // S3 → Lambda (S3 triggers Lambda)
  {
    policyType: 'resource-based',
    sourceService: 'S3',
    targetService: 'Lambda',
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:*:*:function:*'],
    description: 'Allow S3 to invoke Lambda function'
  },
  
  // Lambda → S3 (Lambda accesses S3)
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'S3',
    actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
    resources: ['arn:aws:s3:::bucket-name', 'arn:aws:s3:::bucket-name/*'],
    description: 'Allow Lambda to access S3 bucket'
  },
  
  // API Gateway → Lambda
  {
    policyType: 'resource-based',
    sourceService: 'API Gateway',
    targetService: 'Lambda',
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:*:*:function:*'],
    description: 'Allow API Gateway to invoke Lambda function'
  },
  
  // Lambda → DynamoDB
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'DynamoDB',
    actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:Query', 'dynamodb:Scan'],
    resources: ['arn:aws:dynamodb:*:*:table/*'],
    description: 'Allow Lambda to access DynamoDB table'
  },
  
  // Lambda → RDS
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'RDS',
    actions: ['rds-db:connect'],
    resources: ['arn:aws:rds-db:*:*:dbuser:*/lambda-user'],
    description: 'Allow Lambda to connect to RDS database'
  },
  
  // SNS → Lambda
  {
    policyType: 'resource-based',
    sourceService: 'SNS',
    targetService: 'Lambda',
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:*:*:function:*'],
    description: 'Allow SNS to invoke Lambda function'
  },
  
  // Lambda → SNS
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'SNS',
    actions: ['sns:Publish'],
    resources: ['arn:aws:sns:*:*:*'],
    description: 'Allow Lambda to publish to SNS topic'
  },
  
  // SQS → Lambda
  {
    policyType: 'resource-based',
    sourceService: 'SQS',
    targetService: 'Lambda',
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:*:*:function:*'],
    description: 'Allow SQS to invoke Lambda function'
  },
  
  // Lambda → SQS
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'SQS',
    actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
    resources: ['arn:aws:sqs:*:*:*'],
    description: 'Allow Lambda to access SQS queue'
  },
  
  // CloudWatch Events → Lambda
  {
    policyType: 'resource-based',
    sourceService: 'CloudWatch Events',
    targetService: 'Lambda',
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:*:*:function:*'],
    description: 'Allow CloudWatch Events to invoke Lambda function'
  },
  
  // Lambda → CloudWatch
  {
    policyType: 'execution-role',
    sourceService: 'Lambda',
    targetService: 'CloudWatch',
    actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
    resources: ['arn:aws:logs:*:*:*'],
    description: 'Allow Lambda to write to CloudWatch Logs'
  }
]

// Function to get IAM policy requirements for a specific connection
export function getIAMPolicyRequirements(
  sourceService: string, 
  targetService: string, 
  _connectionType: 'trigger' | 'permission' | 'data_flow'
): IAMPolicyRequirement[] {
  return IAM_POLICY_REQUIREMENTS.filter(req => 
    req.sourceService === sourceService && 
    req.targetService === targetService
  )
}

// Function to determine if a service can interact with another
export function canServicesInteract(sourceService: string, targetService: string): boolean {
  const sourceCapabilities = SERVICE_CAPABILITIES[sourceService]
  const targetCapabilities = SERVICE_CAPABILITIES[targetService]
  
  if (!sourceCapabilities || !targetCapabilities) {
    return false
  }
  
  return sourceCapabilities.canInvoke.includes(targetService) || 
         targetCapabilities.canBeInvokedBy.includes(sourceService) ||
         sourceCapabilities.canAccess.includes(targetService) ||
         targetCapabilities.canBeAccessedBy.includes(sourceService)
}

// Function to get the correct policy type for a connection
export function getPolicyTypeForConnection(
  sourceService: string, 
  targetService: string, 
  connectionType: 'trigger' | 'permission' | 'data_flow'
): 'resource-based' | 'execution-role' | 'both' | null {
  const requirements = getIAMPolicyRequirements(sourceService, targetService, connectionType)
  
  if (requirements.length === 0) {
    return null
  }
  
  // If there's only one requirement, return its type
  if (requirements.length === 1) {
    return requirements[0].policyType
  }
  
  // If there are multiple requirements, check if they're all the same type
  const types = [...new Set(requirements.map(req => req.policyType))]
  if (types.length === 1) {
    return types[0]
  }
  
  // If there are different types, return 'both'
  return 'both'
}

// Function to generate IAM policy JSON for a specific requirement
export function generateIAMPolicyJSON(
  requirement: IAMPolicyRequirement, 
  _sourceResourceName: string, 
  targetResourceName: string
): string {
  const policy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: requirement.actions,
      Resource: requirement.resources.map(resource => 
        resource.replace('*', targetResourceName)
      ),
      ...(requirement.conditions && { Condition: requirement.conditions })
    }]
  }
  
  return JSON.stringify(policy, null, 2)
}
