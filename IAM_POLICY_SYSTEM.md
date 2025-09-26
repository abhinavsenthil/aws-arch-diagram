# AWS IAM Policy System

This document explains the comprehensive IAM policy system implemented for the AWS Architecture Builder.

## Overview

The system correctly handles the distinction between:
- **Resource-based policies**: Policies attached to the resource being accessed (e.g., Lambda function permissions)
- **Execution role policies**: Policies attached to the service doing the accessing (e.g., Lambda execution role)

## Key Concepts

### 1. Resource-Based Policies
When Service A invokes Service B, Service B needs a resource-based policy allowing Service A to access it.

**Examples:**
- S3 → Lambda: Lambda function needs permission for S3 to invoke it
- API Gateway → Lambda: Lambda function needs permission for API Gateway to invoke it
- SNS → Lambda: Lambda function needs permission for SNS to invoke it

### 2. Execution Role Policies
When Service A needs to access Service B, Service A needs an execution role with permissions to access Service B.

**Examples:**
- Lambda → S3: Lambda execution role needs S3 permissions
- Lambda → DynamoDB: Lambda execution role needs DynamoDB permissions
- Lambda → SNS: Lambda execution role needs SNS permissions

## System Architecture

### Files Structure
```
src/
├── iamPolicyMapping.ts      # Service capabilities and policy requirements
├── iamPolicyGenerator.ts    # IAM policy generation logic
├── iamPolicyExamples.ts     # Usage examples
└── components/
    └── TerraformCodePanel.tsx  # Updated to use new system
```

### Core Components

#### 1. Service Capabilities (`iamPolicyMapping.ts`)
Defines what each AWS service can do:
- `canInvoke`: Services this can invoke
- `canBeInvokedBy`: Services that can invoke this
- `canAccess`: Services this can access
- `canBeAccessedBy`: Services that can access this

#### 2. Policy Requirements
Defines specific IAM policy requirements for each service interaction:
- Policy type (resource-based, execution-role, or both)
- Required actions
- Resource ARNs
- Conditions

#### 3. Policy Generator (`iamPolicyGenerator.ts`)
Generates appropriate Terraform resources:
- `aws_iam_role`: Execution roles
- `aws_iam_role_policy`: Execution role policies
- `aws_lambda_permission`: Resource-based policies for Lambda
- `aws_iam_role_policy_attachment`: Basic role attachments

## Usage Examples

### Example 1: S3 → Lambda (S3 triggers Lambda)
```typescript
const components = [
  { id: 's3-1', type: 'S3', properties: { name: 'my-bucket' } },
  { id: 'lambda-1', type: 'Lambda', properties: { name: 'my-function' } }
]

const connections = [
  {
    from: 's3-1',
    to: 'lambda-1',
    type: 'trigger',
    direction: 'unidirectional'
  }
]
```

**Generated Policies:**
1. `aws_lambda_permission`: Allows S3 to invoke Lambda
2. `aws_s3_bucket_notification`: S3 bucket notification configuration

### Example 2: Lambda → S3 (Lambda accesses S3)
```typescript
const connections = [
  {
    from: 'lambda-1',
    to: 's3-1',
    type: 'permission',
    direction: 'unidirectional'
  }
]
```

**Generated Policies:**
1. `aws_iam_role`: Lambda execution role
2. `aws_iam_role_policy`: S3 access permissions for Lambda
3. `aws_iam_role_policy_attachment`: Basic Lambda execution role

### Example 3: API Gateway → Lambda → DynamoDB
```typescript
const components = [
  { id: 'api-1', type: 'API Gateway', properties: { name: 'my-api' } },
  { id: 'lambda-1', type: 'Lambda', properties: { name: 'api-handler' } },
  { id: 'dynamodb-1', type: 'DynamoDB', properties: { name: 'user-data' } }
]

const connections = [
  { from: 'api-1', to: 'lambda-1', type: 'trigger' },
  { from: 'lambda-1', to: 'dynamodb-1', type: 'permission' }
]
```

**Generated Policies:**
1. `aws_lambda_permission`: Allows API Gateway to invoke Lambda
2. `aws_iam_role`: Lambda execution role
3. `aws_iam_role_policy`: DynamoDB access permissions for Lambda
4. `aws_iam_role_policy_attachment`: Basic Lambda execution role

## Supported Service Interactions

### Services That Can Invoke Lambda
- S3 (via bucket notifications)
- API Gateway
- SNS
- SQS
- CloudWatch Events

### Services Lambda Can Access
- S3 (read/write objects)
- DynamoDB (CRUD operations)
- RDS (database connections)
- SNS (publish messages)
- SQS (send/receive messages)
- CloudWatch (write logs)

### Other Service Interactions
- API Gateway → Lambda
- Lambda → API Gateway
- SNS → Lambda
- Lambda → SNS
- SQS → Lambda
- Lambda → SQS

## Policy Types Generated

### 1. Execution Roles
```hcl
resource "aws_iam_role" "lambda_execution_role" {
  name = "lambda-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}
```

### 2. Resource-Based Policies
```hcl
resource "aws_lambda_permission" "my_function_s3_permission" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_function.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.my_bucket.arn
}
```

### 3. Execution Role Policies
```hcl
resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "lambda-s3-access"
  role = aws_iam_role.lambda_execution_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = "${aws_s3_bucket.my_bucket.arn}/*"
    }]
  })
}
```

## Benefits of the New System

1. **Correct Policy Types**: Automatically generates the right type of policy for each interaction
2. **Comprehensive Coverage**: Supports all major AWS service interactions
3. **Extensible**: Easy to add new services and interactions
4. **No Duplication**: Prevents duplicate policies and roles
5. **Proper Naming**: Uses consistent, descriptive naming conventions
6. **Terraform Best Practices**: Generates clean, maintainable Terraform code

## Adding New Services

To add support for a new AWS service:

1. **Update Service Capabilities** in `iamPolicyMapping.ts`:
```typescript
'NewService': {
  canInvoke: ['Lambda', 'SQS'],
  canBeInvokedBy: ['Lambda', 'API Gateway'],
  canAccess: ['S3', 'DynamoDB'],
  canBeAccessedBy: ['Lambda', 'EC2']
}
```

2. **Add Policy Requirements**:
```typescript
{
  policyType: 'execution-role',
  sourceService: 'Lambda',
  targetService: 'NewService',
  actions: ['newservice:Action1', 'newservice:Action2'],
  resources: ['arn:aws:newservice:*:*:*'],
  description: 'Allow Lambda to access NewService'
}
```

3. **Update Policy Generator** if needed for service-specific logic

The system will automatically handle the new service interactions!
