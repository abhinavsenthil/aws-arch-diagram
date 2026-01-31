export type ComponentType = 
  | 'EC2'
  | 'S3'
  | 'RDS'
  | 'Lambda'
  | 'API Gateway'
  | 'CloudFront'
  | 'Route53'
  | 'VPC'
  | 'Subnet'
  | 'Internet Gateway'
  | 'Security Group'
  | 'Load Balancer'
  | 'Auto Scaling Group'
  | 'SQS'
  | 'SNS'
  | 'CloudWatch'
  | 'IAM'
  | 'KMS'
  | 'DynamoDB'
  | 'ElastiCache'
  | 'ElasticSearch'
  | 'SES'
  | 'CloudFormation'
  | 'CodePipeline'
  | 'CodeBuild'
  | 'CodeDeploy'

export interface Position {
  x: number
  y: number
}

export interface AWSComponent {
  id: string
  type: ComponentType
  position: Position
  properties: Record<string, any>
}

export interface Connection {
  from: string
  to: string
  type: 'trigger' | 'permission' | 'data_flow'
  direction: 'unidirectional' | 'bidirectional'
  fromPort: 'left' | 'right'
  toPort: 'left' | 'right'
}

export interface TerraformResource {
  type: string
  name: string
  properties: Record<string, any>
}

export interface TerraformConfiguration {
  provider: string
  resources: TerraformResource[]
  variables?: Record<string, any>
  outputs?: Record<string, any>
}
