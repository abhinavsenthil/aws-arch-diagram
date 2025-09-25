import React, { useState } from 'react'
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
        const s3BucketName = fromComponent.properties.name || fromComponent.type.toLowerCase().replace(/\s+/g, '_')
        const lambdaFunctionName = toComponent.properties.name || toComponent.type.toLowerCase().replace(/\s+/g, '_')
        
        resources.push({
          type: 'aws_s3_bucket_notification',
          name: `${s3BucketName}_lambda_trigger`,
          properties: {
            bucket: '${aws_s3_bucket.' + s3BucketName + '.id}',
            lambda_function: [{
              lambda_function_arn: '${aws_lambda_function.' + lambdaFunctionName + '.arn}',
              events: ['s3:ObjectCreated:*']
            }]
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

function generateResourceForComponent(component: AWSComponent, allComponents: AWSComponent[], connections: Connection[]): any {
  const baseName = component.properties.name || component.type.toLowerCase().replace(/\s+/g, '_')
  
  switch (component.type) {
    case 'EC2':
      return {
        type: 'aws_instance',
        name: baseName,
        properties: {
          ami: 'ami-0c02fb55956c7d316',
          instance_type: 't2.micro',
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
          bucket: `${baseName}-${Date.now()}`,
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
          instance_class: 'db.t2.micro',
          allocated_storage: 20,
          username: 'admin',
          password: 'password123',
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Lambda':
      const lambdaResource: any = {
        type: 'aws_lambda_function',
        name: baseName,
        properties: {
          filename: 'lambda_function.zip',
          function_name: baseName,
          role: '${aws_iam_role.lambda_execution_role.arn}',
          handler: 'index.handler',
          runtime: 'python3.9',
          tags: {
            Name: baseName
          }
        }
      }

      // Check if Lambda is connected to S3 (both as trigger and permission)
      const s3Connections = connections.filter(conn => 
        (conn.from === component.id || conn.to === component.id) &&
        allComponents.find(comp => 
          comp.id === (conn.from === component.id ? conn.to : conn.from)
        )?.type === 'S3'
      )

      if (s3Connections.length > 0) {
        const s3Components = allComponents.filter(comp => 
          s3Connections.some(conn => 
            comp.id === (conn.from === component.id ? conn.to : conn.from)
          )
        )
        
        if (s3Components.length > 0) {
          const environmentVariables: Record<string, string> = {}
          
          // Add environment variables for each S3 bucket
          s3Components.forEach((s3Component) => {
            const s3BucketName = s3Component.properties.name || s3Component.type.toLowerCase().replace(/\s+/g, '_')
            const connection = s3Connections.find(conn => 
              conn.from === component.id ? conn.to === s3Component.id : conn.from === s3Component.id
            )
            
            if (connection) {
              if (connection.type === 'trigger') {
                // S3 triggers Lambda - this is the input bucket
                environmentVariables.INPUT_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
              } else if (connection.type === 'permission') {
                // Lambda accesses S3 - this is the output bucket
                environmentVariables.OUTPUT_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
              }
            }
          })
          
          // Add S3_BUCKET for backward compatibility if only one bucket
          if (s3Components.length === 1) {
            const s3BucketName = s3Components[0].properties.name || s3Components[0].type.toLowerCase().replace(/\s+/g, '_')
            environmentVariables.S3_BUCKET = '${aws_s3_bucket.' + s3BucketName + '.bucket}'
          }
          
          lambdaResource.properties.environment = {
            variables: environmentVariables
          }
        }
      }

      return lambdaResource
    
    case 'VPC':
      return {
        type: 'aws_vpc',
        name: baseName,
        properties: {
          cidr_block: '10.0.0.0/16',
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Name: baseName
          }
        }
      }
    
    case 'Security Group':
      return {
        type: 'aws_security_group',
        name: baseName,
        properties: {
          name: baseName,
          description: 'Security group for ' + baseName,
          vpc_id: '${aws_vpc.main.id}',
          ingress: [
            {
              from_port: 22,
              to_port: 22,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0']
            }
          ],
          egress: [
            {
              from_port: 0,
              to_port: 0,
              protocol: '-1',
              cidr_blocks: ['0.0.0.0/0']
            }
          ],
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

function formatTerraformCode(config: TerraformConfiguration): string {
  let code = `# Terraform configuration generated by AWS Architecture Builder\n\n`
  
  // Provider
  code += `terraform {\n`
  code += `  required_providers {\n`
  code += `    aws = {\n`
  code += `      source  = "hashicorp/aws"\n`
  code += `      version = "~> 5.0"\n`
  code += `    }\n`
  code += `  }\n`
  code += `}\n\n`
  
  code += `provider "aws" {\n`
  code += `  region = "${config.resources.find(r => r.type === 'provider')?.properties?.region || 'us-west-2'}"\n`
  code += `}\n\n`
  
  // Resources
  config.resources.forEach(resource => {
    if (resource.type === 'provider') return
    
    code += `resource "${resource.type}" "${resource.name}" {\n`
    Object.entries(resource.properties).forEach(([key, value]) => {
      if (typeof value === 'string') {
        code += `  ${key} = "${value}"\n`
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        code += `  ${key} = ${value}\n`
      } else if (Array.isArray(value)) {
        code += `  ${key} = [\n`
        value.forEach(item => {
          if (typeof item === 'object') {
            code += `    {\n`
            Object.entries(item).forEach(([k, v]) => {
              code += `      ${k} = "${v}"\n`
            })
            code += `    },\n`
          } else {
            code += `    "${item}",\n`
          }
        })
        code += `  ]\n`
      } else if (typeof value === 'object') {
        code += `  ${key} = {\n`
        Object.entries(value).forEach(([k, v]) => {
          code += `    ${k} = "${v}"\n`
        })
        code += `  }\n`
      }
    })
    code += `}\n\n`
  })
  
  return code
}
