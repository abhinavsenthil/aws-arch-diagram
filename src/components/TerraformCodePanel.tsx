import { useState } from 'react'
import { AWSComponent, Connection, TerraformConfiguration } from '../types'
import { Copy, Download, Play, RefreshCw } from 'lucide-react'
import { generateAllIAMPolicies, generateBasicExecutionRoleAttachments, IAMPolicyContext } from '../iamPolicyGenerator'

interface TerraformCodePanelProps {
  components: AWSComponent[]
  connections: Connection[]
}

export const TerraformCodePanel: React.FC<TerraformCodePanelProps> = ({
  components,
  connections
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  const generateTerraformCode = () => {
    setIsGenerating(true)
    
    // Simulate generation delay
    setTimeout(() => {
      try {
        const config = generateTerraformConfiguration(components, connections)
        const code = formatTerraformCode(config)
        setGeneratedCode(code)
        setIsGenerating(false)
      } catch (error) {
        console.error('Error generating Terraform code:', error)
        setGeneratedCode('// Error generating Terraform code\n// Please check your architecture configuration')
        setIsGenerating(false)
      }
    }, 1000)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'main.tf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Terraform Code</h2>
          <div className="flex space-x-2">
            <button
              onClick={generateTerraformCode}
              disabled={isGenerating || components.length === 0}
              className="flex items-center space-x-1 px-3 py-1 bg-aws-orange text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              <span className="text-sm">Generate</span>
            </button>
          </div>
        </div>
        
        {components.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Add components to generate Terraform code</p>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {generatedCode && (
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>
              <button
                onClick={downloadCode}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <Download size={12} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {generatedCode ? (
            <pre className="p-4 text-xs text-gray-800 bg-gray-50 h-full overflow-auto">
              <code>{generatedCode}</code>
            </pre>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Click "Generate" to create Terraform code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function generateTerraformConfiguration(components: AWSComponent[], connections: Connection[]): TerraformConfiguration {
  const resources: any[] = []
  
  // Generate provider
  resources.push({
    type: 'provider',
    name: 'aws',
    properties: {
      region: 'us-west-2'
    }
  })

  // Generate resources for each component
  components.forEach(component => {
    const resource = generateResourceForComponent(component, components, connections)
    if (resource) {
      resources.push(resource)
    }
  })

  // Generate IAM policies using the new system
  const iamContext: IAMPolicyContext = {
    components,
    connections,
    existingRoles: new Set(),
    existingPolicies: new Set()
  }

  // Generate all IAM policies
  const iamPolicies = generateAllIAMPolicies(iamContext)
  iamPolicies.forEach(policy => {
    resources.push({
      type: policy.type,
      name: policy.name,
      properties: policy.properties
    })
  })

  // Generate basic execution role attachments
  const basicAttachments = generateBasicExecutionRoleAttachments(iamContext)
  basicAttachments.forEach(attachment => {
    resources.push({
      type: attachment.type,
      name: attachment.name,
      properties: attachment.properties
    })
  })

  // Generate service-specific triggers and notifications
  connections.forEach(connection => {
    if (connection.type === 'trigger') {
      const fromComponent = components.find(c => c.id === connection.from)
      const toComponent = components.find(c => c.id === connection.to)
      
      if (fromComponent?.type === 'S3' && toComponent?.type === 'Lambda') {
        const s3BucketName = sanitizeName(fromComponent.properties.name || 's3_bucket')
        const lambdaFunctionName = sanitizeName(toComponent.properties.name || 'lambda_function')
        
        resources.push({
          type: 'aws_s3_bucket_notification',
          name: `${s3BucketName}_lambda_trigger`,
          properties: {
            bucket: `aws_s3_bucket.${s3BucketName}.id`,
            lambda_function: [{
              lambda_function_arn: `aws_lambda_function.${lambdaFunctionName}.arn`,
              events: ['s3:ObjectCreated:*']
            }],
            depends_on: [`aws_lambda_permission.${lambdaFunctionName}_${s3BucketName}_permission`]
          }
        })
      }
      
      // SNS -> Lambda trigger
      if (fromComponent?.type === 'SNS' && toComponent?.type === 'Lambda') {
        const snsTopicName = sanitizeName(fromComponent.properties.name || 'sns_topic')
        const lambdaFunctionName = sanitizeName(toComponent.properties.name || 'lambda_function')
        
        resources.push({
          type: 'aws_sns_topic_subscription',
          name: `${snsTopicName}_lambda_subscription`,
          properties: {
            topic_arn: `aws_sns_topic.${snsTopicName}.arn`,
            protocol: 'lambda',
            endpoint: `aws_lambda_function.${lambdaFunctionName}.arn`
          }
        })
      }
      
      // SQS -> Lambda trigger
      if (fromComponent?.type === 'SQS' && toComponent?.type === 'Lambda') {
        const sqsQueueName = sanitizeName(fromComponent.properties.name || 'sqs_queue')
        const lambdaFunctionName = sanitizeName(toComponent.properties.name || 'lambda_function')
        
        resources.push({
          type: 'aws_lambda_event_source_mapping',
          name: `${sqsQueueName}_lambda_trigger`,
          properties: {
            event_source_arn: `aws_sqs_queue.${sqsQueueName}.arn`,
            function_name: `aws_lambda_function.${lambdaFunctionName}.arn`,
            batch_size: 10,
            enabled: true
          }
        })
      }
      
      // API Gateway -> Lambda trigger (create integration)
      if (fromComponent?.type === 'API Gateway' && toComponent?.type === 'Lambda') {
        const apiName = sanitizeName(fromComponent.properties.name || 'api_gateway')
        const lambdaFunctionName = sanitizeName(toComponent.properties.name || 'lambda_function')
        
        // Create a root resource method
        resources.push({
          type: 'aws_api_gateway_resource',
          name: `${apiName}_resource`,
          properties: {
            rest_api_id: `aws_api_gateway_rest_api.${apiName}.id`,
            parent_id: `aws_api_gateway_rest_api.${apiName}.root_resource_id`,
            path_part: 'api'
          }
        })
        
        resources.push({
          type: 'aws_api_gateway_method',
          name: `${apiName}_method`,
          properties: {
            rest_api_id: `aws_api_gateway_rest_api.${apiName}.id`,
            resource_id: `aws_api_gateway_resource.${apiName}_resource.id`,
            http_method: 'ANY',
            authorization: 'NONE'
          }
        })
        
        resources.push({
          type: 'aws_api_gateway_integration',
          name: `${apiName}_integration`,
          properties: {
            rest_api_id: `aws_api_gateway_rest_api.${apiName}.id`,
            resource_id: `aws_api_gateway_resource.${apiName}_resource.id`,
            http_method: `aws_api_gateway_method.${apiName}_method.http_method`,
            integration_http_method: 'POST',
            type: 'AWS_PROXY',
            uri: `aws_lambda_function.${lambdaFunctionName}.invoke_arn`
          }
        })
      }
    }
  })

  return {
    provider: 'aws',
    resources,
    variables: {},
    outputs: {}
  }
}

// Helper to sanitize resource names for Terraform
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function generateResourceForComponent(component: AWSComponent, allComponents: AWSComponent[], connections: Connection[]): any {
  const rawName = component.properties.name || component.type.toLowerCase().replace(/\s+/g, '_')
  const baseName = sanitizeName(rawName)
  
  switch (component.type) {
    case 'EC2':
      // Find VPC/Security Group connections
      const vpcComponent = allComponents.find(c => c.type === 'VPC')
      const sgComponent = allComponents.find(c => c.type === 'Security Group')
      
      return {
        type: 'aws_instance',
        name: baseName,
        properties: {
          ami: 'var.ami_id',
          instance_type: 'var.instance_type',
          ...(sgComponent && { vpc_security_group_ids: `[aws_security_group.${sanitizeName(sgComponent.properties.name || 'security_group')}.id]` }),
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'S3':
      return {
        type: 'aws_s3_bucket',
        name: baseName,
        properties: {
          bucket: `var.s3_bucket_prefix_${baseName}`,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'RDS':
      return {
        type: 'aws_db_instance',
        name: baseName,
        properties: {
          identifier: baseName,
          engine: 'mysql',
          engine_version: '8.0',
          instance_class: 'var.db_instance_class',
          allocated_storage: 20,
          db_name: baseName.replace(/-/g, '_'),
          username: 'var.db_username',
          password: 'var.db_password',
          skip_final_snapshot: true,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'DynamoDB':
      return {
        type: 'aws_dynamodb_table',
        name: baseName,
        properties: {
          name: baseName,
          billing_mode: 'PAY_PER_REQUEST',
          hash_key: 'id',
          attribute: [
            { name: 'id', type: 'S' }
          ],
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Lambda':
      // Use properties from component if available
      const lambdaRuntime = component.properties.runtime || 'python3.9'
      const lambdaHandler = component.properties.handler || 'index.handler'
      const lambdaTimeout = component.properties.timeout || 30
      const lambdaMemory = component.properties.memorySize || 128
      
      const lambdaResource: any = {
        type: 'aws_lambda_function',
        name: baseName,
        properties: {
          filename: 'var.lambda_zip_path',
          function_name: component.properties.name || baseName,
          role: `aws_iam_role.lambda_execution_role.arn`,
          handler: `"${lambdaHandler}"`,
          runtime: `"${lambdaRuntime}"`,
          timeout: lambdaTimeout,
          memory_size: lambdaMemory,
          tags: {
            Name: component.properties.name || baseName
          }
        }
      }

      // Check if Lambda is connected to other services
      const lambdaConnections = connections.filter(conn => 
        conn.from === component.id || conn.to === component.id
      )

      if (lambdaConnections.length > 0) {
        const environmentVariables: Record<string, string> = {}
        
        lambdaConnections.forEach(connection => {
          const connectedComp = allComponents.find(comp => 
            comp.id === (connection.from === component.id ? connection.to : connection.from)
          )
          
          if (!connectedComp) return
          
          const connectedName = sanitizeName(connectedComp.properties.name || connectedComp.type.toLowerCase())
          
          if (connectedComp.type === 'S3') {
            if (connection.type === 'trigger' && connection.from !== component.id) {
              environmentVariables.INPUT_BUCKET = `aws_s3_bucket.${connectedName}.bucket`
            } else if (connection.type === 'permission' && connection.from === component.id) {
              environmentVariables.OUTPUT_BUCKET = `aws_s3_bucket.${connectedName}.bucket`
            }
          } else if (connectedComp.type === 'DynamoDB') {
            environmentVariables.DYNAMODB_TABLE = `aws_dynamodb_table.${connectedName}.name`
          } else if (connectedComp.type === 'SQS') {
            environmentVariables.SQS_QUEUE_URL = `aws_sqs_queue.${connectedName}.url`
          } else if (connectedComp.type === 'SNS') {
            environmentVariables.SNS_TOPIC_ARN = `aws_sns_topic.${connectedName}.arn`
          }
        })
        
        if (Object.keys(environmentVariables).length > 0) {
          lambdaResource.properties.environment = {
            variables: environmentVariables
          }
        }
      }

      return lambdaResource
    
    case 'API Gateway':
      return {
        type: 'aws_api_gateway_rest_api',
        name: baseName,
        properties: {
          name: baseName,
          description: `API Gateway for ${baseName}`,
          endpoint_configuration: {
            types: ['REGIONAL']
          },
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'SQS':
      return {
        type: 'aws_sqs_queue',
        name: baseName,
        properties: {
          name: baseName,
          delay_seconds: 0,
          max_message_size: 262144,
          message_retention_seconds: 345600,
          visibility_timeout_seconds: 30,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'SNS':
      return {
        type: 'aws_sns_topic',
        name: baseName,
        properties: {
          name: baseName,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'CloudWatch':
      return {
        type: 'aws_cloudwatch_log_group',
        name: baseName,
        properties: {
          name: `/aws/custom/${baseName}`,
          retention_in_days: 14,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'VPC':
      // Use CIDR from component properties if available
      const vpcCidr = component.properties.cidr || '10.0.0.0/16'
      return {
        type: 'aws_vpc',
        name: baseName,
        properties: {
          cidr_block: `"${vpcCidr}"`,
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Name: component.properties.name || baseName
          }
        }
      }
    
    case 'Subnet':
      const parentVpc = allComponents.find(c => c.type === 'VPC')
      const vpcName = parentVpc ? sanitizeName(parentVpc.properties.name || 'vpc') : 'main'
      
      // Use properties from component if available
      const subnetCidr = component.properties.cidr || '10.0.1.0/24'
      const availabilityZone = component.properties.availabilityZone || 'us-west-2a'
      const isPublic = component.properties.isPublic !== false
      
      return {
        type: 'aws_subnet',
        name: baseName,
        properties: {
          vpc_id: `aws_vpc.${vpcName}.id`,
          cidr_block: `"${subnetCidr}"`,
          availability_zone: `"${availabilityZone}"`,
          map_public_ip_on_launch: isPublic,
          tags: {
            Name: component.properties.name || baseName,
            Type: isPublic ? 'Public' : 'Private'
          }
        }
      }
    
    case 'Internet Gateway':
      const igwVpc = allComponents.find(c => c.type === 'VPC')
      const igwVpcName = igwVpc ? sanitizeName(igwVpc.properties.name || 'vpc') : 'main'
      
      return {
        type: 'aws_internet_gateway',
        name: baseName,
        properties: {
          vpc_id: `aws_vpc.${igwVpcName}.id`,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Security Group':
      const sgVpc = allComponents.find(c => c.type === 'VPC')
      const sgVpcName = sgVpc ? sanitizeName(sgVpc.properties.name || 'vpc') : 'main'
      
      return {
        type: 'aws_security_group',
        name: baseName,
        properties: {
          name: baseName,
          description: `Security group for ${baseName}`,
          vpc_id: `aws_vpc.${sgVpcName}.id`,
          ingress: [
            {
              from_port: 443,
              to_port: 443,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0'],
              description: 'HTTPS'
            }
          ],
          egress: [
            {
              from_port: 0,
              to_port: 0,
              protocol: '-1',
              cidr_blocks: ['0.0.0.0/0'],
              description: 'Allow all outbound'
            }
          ],
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Load Balancer':
      const lbVpc = allComponents.find(c => c.type === 'VPC')
      const subnets = allComponents.filter(c => c.type === 'Subnet')
      
      return {
        type: 'aws_lb',
        name: baseName,
        properties: {
          name: baseName,
          internal: false,
          load_balancer_type: 'application',
          subnets: subnets.length > 0 
            ? subnets.map(s => `aws_subnet.${sanitizeName(s.properties.name || 'subnet')}.id`)
            : ['var.subnet_ids'],
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'CloudFront':
      // Find connected S3 bucket
      const cfS3Connection = connections.find(conn => 
        (conn.from === component.id || conn.to === component.id) &&
        allComponents.find(c => c.id === (conn.from === component.id ? conn.to : conn.from))?.type === 'S3'
      )
      const cfS3 = cfS3Connection 
        ? allComponents.find(c => c.id === (cfS3Connection.from === component.id ? cfS3Connection.to : cfS3Connection.from))
        : null
      
      return {
        type: 'aws_cloudfront_distribution',
        name: baseName,
        properties: {
          enabled: true,
          is_ipv6_enabled: true,
          default_root_object: 'index.html',
          origin: [{
            domain_name: cfS3 
              ? `aws_s3_bucket.${sanitizeName(cfS3.properties.name || 's3')}.bucket_regional_domain_name`
              : 'var.origin_domain',
            origin_id: 'S3Origin'
          }],
          default_cache_behavior: {
            allowed_methods: ['GET', 'HEAD'],
            cached_methods: ['GET', 'HEAD'],
            target_origin_id: 'S3Origin',
            viewer_protocol_policy: 'redirect-to-https',
            forwarded_values: {
              query_string: false,
              cookies: { forward: 'none' }
            }
          },
          restrictions: {
            geo_restriction: {
              restriction_type: 'none'
            }
          },
          viewer_certificate: {
            cloudfront_default_certificate: true
          },
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Route53':
      return {
        type: 'aws_route53_zone',
        name: baseName,
        properties: {
          name: 'var.domain_name',
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'ElastiCache':
      return {
        type: 'aws_elasticache_cluster',
        name: baseName,
        properties: {
          cluster_id: baseName,
          engine: 'redis',
          node_type: 'cache.t3.micro',
          num_cache_nodes: 1,
          port: 6379,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'IAM':
      return {
        type: 'aws_iam_role',
        name: baseName,
        properties: {
          name: baseName,
          assume_role_policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' }
            }]
          }),
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'KMS':
      return {
        type: 'aws_kms_key',
        name: baseName,
        properties: {
          description: `KMS key for ${baseName}`,
          deletion_window_in_days: 7,
          enable_key_rotation: true,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'SES':
      return {
        type: 'aws_ses_domain_identity',
        name: baseName,
        properties: {
          domain: 'var.ses_domain'
        }
      }
    
    case 'Auto Scaling Group':
      return {
        type: 'aws_autoscaling_group',
        name: baseName,
        properties: {
          name: baseName,
          min_size: 1,
          max_size: 3,
          desired_capacity: 2,
          launch_template: {
            id: 'var.launch_template_id',
            version: '$Latest'
          },
          vpc_zone_identifier: ['var.subnet_ids'],
          tag: [{
            key: 'Name',
            value: baseName,
            propagate_at_launch: true
          }]
        }
      }
    
    case 'CodePipeline':
      return {
        type: 'aws_codepipeline',
        name: baseName,
        properties: {
          name: baseName,
          role_arn: 'var.codepipeline_role_arn',
          artifact_store: {
            location: 'var.artifact_bucket',
            type: 'S3'
          },
          stage: [
            {
              name: 'Source',
              action: [{
                name: 'Source',
                category: 'Source',
                owner: 'AWS',
                provider: 'CodeStarSourceConnection',
                version: '1',
                output_artifacts: ['source_output'],
                configuration: {
                  ConnectionArn: 'var.codestar_connection_arn',
                  FullRepositoryId: 'var.repository_id',
                  BranchName: 'main'
                }
              }]
            },
            {
              name: 'Deploy',
              action: [{
                name: 'Deploy',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                input_artifacts: ['source_output'],
                configuration: {
                  BucketName: 'var.deploy_bucket',
                  Extract: 'true'
                }
              }]
            }
          ],
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'CodeBuild':
      return {
        type: 'aws_codebuild_project',
        name: baseName,
        properties: {
          name: baseName,
          description: `CodeBuild project for ${baseName}`,
          service_role: 'var.codebuild_role_arn',
          artifacts: {
            type: 'NO_ARTIFACTS'
          },
          environment: {
            compute_type: 'BUILD_GENERAL1_SMALL',
            image: 'aws/codebuild/standard:5.0',
            type: 'LINUX_CONTAINER'
          },
          source: {
            type: 'GITHUB',
            location: 'var.github_repo_url'
          },
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'CodeDeploy':
      return {
        type: 'aws_codedeploy_app',
        name: baseName,
        properties: {
          name: baseName,
          compute_platform: 'Server',
          tags: {
            Name: baseName
          }
        }
      }
    
    default:
      return {
        type: `aws_${component.type.toLowerCase().replace(/\s+/g, '_')}`,
        name: baseName,
        properties: {
          tags: {
            Name: baseName
          }
        }
      }
  }
}

// Helper to check if a value is a Terraform reference (variable or resource reference)
function isTerraformReference(value: string): boolean {
  return value.startsWith('var.') || 
         value.startsWith('aws_') || 
         value.startsWith('${') ||
         value.startsWith('local.') ||
         value.startsWith('data.')
}

// Helper to format a value for Terraform HCL
function formatValue(value: any, indent: number = 2): string {
  const spaces = ' '.repeat(indent)
  
  if (value === null || value === undefined) {
    return 'null'
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  if (typeof value === 'number') {
    return value.toString()
  }
  
  if (typeof value === 'string') {
    // Check if it's a Terraform reference that shouldn't be quoted
    if (isTerraformReference(value)) {
      return value
    }
    // Check if it's already interpolated
    if (value.startsWith('${') && value.endsWith('}')) {
      return `"${value}"`
    }
    // Regular string
    return `"${value.replace(/"/g, '\\"')}"`
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }
    // Check if array contains objects (block syntax) or primitives (list syntax)
    if (typeof value[0] === 'object' && !Array.isArray(value[0])) {
      // This is for block-style arrays
      return value.map(item => formatValue(item, indent)).join('\n')
    }
    // Regular list
    const items = value.map(item => {
      if (typeof item === 'string' && isTerraformReference(item)) {
        return item
      }
      return formatValue(item, indent + 2)
    })
    return `[${items.join(', ')}]`
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return '{}'
    }
    const innerSpaces = ' '.repeat(indent + 2)
    const lines = entries.map(([k, v]) => {
      const formattedValue = formatValue(v, indent + 2)
      return `${innerSpaces}${k} = ${formattedValue}`
    })
    return `{\n${lines.join('\n')}\n${spaces}}`
  }
  
  return String(value)
}

// Format a resource block with proper HCL syntax
function formatResourceBlock(resource: any, indent: number = 2): string {
  const spaces = ' '.repeat(indent)
  let output = ''
  
  Object.entries(resource.properties).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    
    // Handle special block types that use repeated blocks instead of lists
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Check if this is a block type (like ingress, egress, stage, action)
      const blockTypes = ['ingress', 'egress', 'stage', 'action', 'attribute', 'origin', 'tag', 'lambda_function']
      if (blockTypes.includes(key)) {
        value.forEach((item: any) => {
          output += `${spaces}${key} {\n`
          Object.entries(item).forEach(([k, v]) => {
            const formattedValue = formatValue(v, indent + 2)
            output += `${spaces}  ${k} = ${formattedValue}\n`
          })
          output += `${spaces}}\n\n`
        })
        return
      }
    }
    
    // Handle nested blocks (like environment, default_cache_behavior)
    if (typeof value === 'object' && !Array.isArray(value)) {
      const blockTypes = ['environment', 'endpoint_configuration', 'default_cache_behavior', 
                          'restrictions', 'geo_restriction', 'viewer_certificate', 'forwarded_values',
                          'cookies', 'artifacts', 'source', 'launch_template', 'artifact_store']
      if (blockTypes.includes(key)) {
        output += `${spaces}${key} {\n`
        Object.entries(value).forEach(([k, v]) => {
          if (typeof v === 'object' && !Array.isArray(v)) {
            output += `${spaces}  ${k} {\n`
            Object.entries(v).forEach(([k2, v2]) => {
              output += `${spaces}    ${k2} = ${formatValue(v2, indent + 4)}\n`
            })
            output += `${spaces}  }\n`
          } else {
            output += `${spaces}  ${k} = ${formatValue(v, indent + 2)}\n`
          }
        })
        output += `${spaces}}\n\n`
        return
      }
    }
    
    // Regular properties
    output += `${spaces}${key} = ${formatValue(value, indent)}\n`
  })
  
  return output
}

function formatTerraformCode(config: TerraformConfiguration): string {
  let code = `# Terraform configuration generated by AWS Architecture Builder
# ============================================================
# IMPORTANT: Review and customize variables before applying
# ============================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================================
# Variables - Customize these values
# ============================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c02fb55956c7d316"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database admin username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block for subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for subnet"
  type        = string
  default     = "us-west-2a"
}

variable "lambda_zip_path" {
  description = "Path to Lambda function zip file"
  type        = string
  default     = "lambda_function.zip"
}

# ============================================================
# Resources
# ============================================================

`
  
  // Resources
  config.resources.forEach(resource => {
    if (resource.type === 'provider') return
    
    code += `resource "${resource.type}" "${resource.name}" {\n`
    code += formatResourceBlock(resource)
    code += `}\n\n`
  })
  
  // Add outputs section
  code += `# ============================================================
# Outputs
# ============================================================

`
  
  // Generate useful outputs
  config.resources.forEach(resource => {
    if (resource.type === 'provider') return
    
    switch (resource.type) {
      case 'aws_lambda_function':
        code += `output "${resource.name}_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.${resource.name}.arn
}

output "${resource.name}_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.${resource.name}.function_name
}

`
        break
      case 'aws_s3_bucket':
        code += `output "${resource.name}_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.${resource.name}.bucket
}

output "${resource.name}_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.${resource.name}.arn
}

`
        break
      case 'aws_api_gateway_rest_api':
        code += `output "${resource.name}_api_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.${resource.name}.id
}

output "${resource.name}_api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.${resource.name}.execution_arn
}

`
        break
      case 'aws_dynamodb_table':
        code += `output "${resource.name}_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.${resource.name}.name
}

output "${resource.name}_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.${resource.name}.arn
}

`
        break
      case 'aws_vpc':
        code += `output "${resource.name}_vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.${resource.name}.id
}

output "${resource.name}_vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.${resource.name}.cidr_block
}

`
        break
      case 'aws_subnet':
        code += `output "${resource.name}_subnet_id" {
  description = "ID of the Subnet"
  value       = aws_subnet.${resource.name}.id
}

`
        break
      case 'aws_sqs_queue':
        code += `output "${resource.name}_queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.${resource.name}.url
}

output "${resource.name}_queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.${resource.name}.arn
}

`
        break
      case 'aws_sns_topic':
        code += `output "${resource.name}_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.${resource.name}.arn
}

`
        break
      case 'aws_lb':
        code += `output "${resource.name}_lb_dns" {
  description = "DNS name of the Load Balancer"
  value       = aws_lb.${resource.name}.dns_name
}

output "${resource.name}_lb_arn" {
  description = "ARN of the Load Balancer"
  value       = aws_lb.${resource.name}.arn
}

`
        break
      case 'aws_db_instance':
        code += `output "${resource.name}_db_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.${resource.name}.endpoint
}

output "${resource.name}_db_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.${resource.name}.port
}

`
        break
    }
  })
  
  return code
}
