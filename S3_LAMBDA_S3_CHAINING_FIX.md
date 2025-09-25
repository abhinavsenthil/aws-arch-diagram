# S3 → Lambda → S3 Chaining Fix

## Problem
The original implementation had issues with S3 → Lambda → S3 chaining where:
1. Lambda environment variables only included one S3 bucket
2. IAM policies were generated separately for each connection
3. The system didn't properly handle Lambda accessing multiple S3 buckets

## Solution

### 1. Enhanced Lambda Environment Variables
**File**: `src/components/TerraformCodePanel.tsx`

**Before**: Only one S3 bucket environment variable
```typescript
environmentVariables.S3_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
```

**After**: Multiple S3 bucket environment variables with context
```typescript
if (connection.type === 'trigger') {
  // S3 triggers Lambda - this is the input bucket
  environmentVariables.INPUT_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
} else if (connection.type === 'permission') {
  // Lambda accesses S3 - this is the output bucket
  environmentVariables.OUTPUT_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
}
```

### 2. Consolidated IAM Policy Generation
**File**: `src/iamPolicyGenerator.ts`

**Before**: Separate policies for each connection
```typescript
// Generated separate policies for each S3 bucket
aws_iam_role_policy.lambda_s3_input_access
aws_iam_role_policy.lambda_s3_output_access
```

**After**: Consolidated policies for multiple S3 buckets
```typescript
// Generates single consolidated policy
aws_iam_role_policy.lambda_processor_s3_access
```

### 3. Smart Policy Consolidation
The new system:
- Groups connections by source component
- Consolidates policies by target service type
- Generates single policies with multiple resource ARNs
- Prevents duplicate policies

## Example: S3 → Lambda → S3 Chain

### Architecture
```
S3 (input-bucket) --[trigger]--> Lambda (image-processor) --[permission]--> S3 (output-bucket)
```

### Generated Resources

#### 1. Lambda Function with Environment Variables
```hcl
resource "aws_lambda_function" "image_processor" {
  function_name = "image-processor"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  
  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.input_bucket.bucket
      OUTPUT_BUCKET = aws_s3_bucket.output_bucket.bucket
    }
  }
}
```

#### 2. IAM Execution Role
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

#### 3. Consolidated S3 Access Policy
```hcl
resource "aws_iam_role_policy" "image_processor_s3_access" {
  name = "image-processor-s3-access"
  role = aws_iam_role.lambda_execution_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        "arn:aws:s3:::input-bucket",
        "arn:aws:s3:::input-bucket/*",
        "arn:aws:s3:::output-bucket",
        "arn:aws:s3:::output-bucket/*"
      ]
    }]
  })
}
```

#### 4. S3 Trigger Permission
```hcl
resource "aws_lambda_permission" "image_processor_s3_input_permission" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.input_bucket.arn
}
```

#### 5. S3 Bucket Notification
```hcl
resource "aws_s3_bucket_notification" "input_bucket_lambda_trigger" {
  bucket = aws_s3_bucket.input_bucket.id
  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
  }
}
```

## Benefits

1. **Proper Environment Variables**: Lambda gets both INPUT_BUCKET and OUTPUT_BUCKET
2. **Consolidated IAM Policies**: Single policy with access to multiple S3 buckets
3. **Correct Policy Types**: Resource-based policy for S3 → Lambda, execution role policy for Lambda → S3
4. **No Duplication**: Prevents duplicate policies and roles
5. **Extensible**: Works with any number of S3 buckets

## Testing

Use the test file `src/testS3LambdaS3Chain.ts` to verify the implementation:

```typescript
import { testS3LambdaS3Chain } from './testS3LambdaS3Chain'

// Run the test
const policies = testS3LambdaS3Chain()
```

This will output all generated IAM policies and verify that the S3 → Lambda → S3 chain works correctly.
