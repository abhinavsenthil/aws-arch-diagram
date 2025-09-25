import { AWSComponent, Connection } from './types'
import { 
  IAMPolicyRequirement, 
  getIAMPolicyRequirements
} from './iamPolicyMapping'

export interface GeneratedIAMPolicy {
  type: 'aws_iam_role' | 'aws_iam_role_policy' | 'aws_iam_role_policy_attachment' | 'aws_lambda_permission' | 'aws_s3_bucket_policy'
  name: string
  properties: Record<string, any>
  description: string
}

export interface IAMPolicyContext {
  components: AWSComponent[]
  connections: Connection[]
  existingRoles: Set<string>
  existingPolicies: Set<string>
}

// Generate all IAM policies needed for the architecture
export function generateAllIAMPolicies(context: IAMPolicyContext): GeneratedIAMPolicy[] {
  const policies: GeneratedIAMPolicy[] = []
  
  // Generate execution roles for services that need them
  const executionRoles = generateExecutionRoles(context)
  policies.push(...executionRoles)
  
  // Generate resource-based policies for connections
  const resourcePolicies = generateResourceBasedPolicies(context)
  policies.push(...resourcePolicies)
  
  // Generate execution role policies for connections
  const executionPolicies = generateExecutionRolePolicies(context)
  policies.push(...executionPolicies)
  
  return policies
}

// Generate execution roles for services that need them
function generateExecutionRoles(context: IAMPolicyContext): GeneratedIAMPolicy[] {
  const roles: GeneratedIAMPolicy[] = []
  const servicesNeedingRoles = new Set<string>()
  
  // Find services that need execution roles
  context.connections.forEach(connection => {
    const fromComponent = context.components.find(c => c.id === connection.from)
    const toComponent = context.components.find(c => c.id === connection.to)
    
    if (fromComponent && toComponent) {
      const requirements = getIAMPolicyRequirements(
        fromComponent.type, 
        toComponent.type, 
        connection.type
      )
      
      requirements.forEach(req => {
        if (req.policyType === 'execution-role' || req.policyType === 'both') {
          servicesNeedingRoles.add(fromComponent.type)
        }
      })
    }
  })
  
  // Generate roles for each service
  servicesNeedingRoles.forEach(serviceType => {
    const roleName = `${serviceType.toLowerCase()}_execution_role`
    
    if (!context.existingRoles.has(roleName)) {
      roles.push({
        type: 'aws_iam_role',
        name: roleName,
        properties: {
          name: `${serviceType.toLowerCase()}-execution-role`,
          assume_role_policy: generateAssumeRolePolicy(serviceType),
          tags: {
            Name: `${serviceType} Execution Role`,
            Service: serviceType
          }
        },
        description: `Execution role for ${serviceType} service`
      })
      
      context.existingRoles.add(roleName)
    }
  })
  
  return roles
}

// Generate resource-based policies (like Lambda permissions)
function generateResourceBasedPolicies(context: IAMPolicyContext): GeneratedIAMPolicy[] {
  const policies: GeneratedIAMPolicy[] = []
  
  context.connections.forEach(connection => {
    const fromComponent = context.components.find(c => c.id === connection.from)
    const toComponent = context.components.find(c => c.id === connection.to)
    
    if (fromComponent && toComponent) {
      const requirements = getIAMPolicyRequirements(
        fromComponent.type, 
        toComponent.type, 
        connection.type
      )
      
      requirements.forEach(req => {
        if (req.policyType === 'resource-based') {
          const policy = generateResourceBasedPolicy(
            req, 
            fromComponent, 
            toComponent, 
            connection
          )
          if (policy) {
            policies.push(policy)
          }
        }
      })
    }
  })
  
  return policies
}

// Generate execution role policies
function generateExecutionRolePolicies(context: IAMPolicyContext): GeneratedIAMPolicy[] {
  const policies: GeneratedIAMPolicy[] = []
  
  // Group connections by source component to consolidate policies
  const connectionsBySource = new Map<string, Connection[]>()
  
  context.connections.forEach(connection => {
    const fromComponent = context.components.find(c => c.id === connection.from)
    if (fromComponent) {
      if (!connectionsBySource.has(fromComponent.id)) {
        connectionsBySource.set(fromComponent.id, [])
      }
      connectionsBySource.get(fromComponent.id)!.push(connection)
    }
  })
  
  // Generate consolidated policies for each source component
  connectionsBySource.forEach((connections, sourceComponentId) => {
    const sourceComponent = context.components.find(c => c.id === sourceComponentId)
    if (!sourceComponent) return
    
    // Group by target service type to consolidate similar policies
    const policiesByTargetType = new Map<string, {
      requirements: IAMPolicyRequirement[],
      targetComponents: AWSComponent[]
    }>()
    
    connections.forEach(connection => {
      const targetComponent = context.components.find(c => c.id === connection.to)
      if (!targetComponent) return
      
      const requirements = getIAMPolicyRequirements(
        sourceComponent.type, 
        targetComponent.type, 
        connection.type
      )
      
      requirements.forEach(req => {
        if (req.policyType === 'execution-role') {
          const key = `${req.sourceService}_${req.targetService}`
          if (!policiesByTargetType.has(key)) {
            policiesByTargetType.set(key, {
              requirements: [],
              targetComponents: []
            })
          }
          
          const existing = policiesByTargetType.get(key)!
          if (!existing.requirements.some(r => 
            r.actions.join(',') === req.actions.join(',') && 
            r.resources.join(',') === req.resources.join(',')
          )) {
            existing.requirements.push(req)
          }
          if (!existing.targetComponents.some(tc => tc.id === targetComponent.id)) {
            existing.targetComponents.push(targetComponent)
          }
        }
      })
    })
    
    // Generate consolidated policies
    policiesByTargetType.forEach(({ requirements, targetComponents }, key) => {
      if (requirements.length > 0) {
        const policy = generateConsolidatedExecutionRolePolicy(
          requirements,
          sourceComponent,
          targetComponents,
          key
        )
        if (policy) {
          policies.push(policy)
        }
      }
    })
  })
  
  return policies
}

// Generate a specific resource-based policy
function generateResourceBasedPolicy(
  _requirement: IAMPolicyRequirement,
  sourceComponent: AWSComponent,
  targetComponent: AWSComponent,
  _connection: Connection
): GeneratedIAMPolicy | null {
  const sourceName = sourceComponent.properties.name || sourceComponent.type.toLowerCase().replace(/\s+/g, '_')
  const targetName = targetComponent.properties.name || targetComponent.type.toLowerCase().replace(/\s+/g, '_')
  
  // Handle different types of resource-based policies
  if (targetComponent.type === 'Lambda' && sourceComponent.type === 'S3') {
    return {
      type: 'aws_lambda_permission',
      name: `${targetName}_${sourceName}_permission`,
      properties: {
        statement_id: `AllowExecutionFrom${sourceComponent.type}`,
        action: 'lambda:InvokeFunction',
        function_name: `\${aws_lambda_function.${targetName}.function_name}`,
        principal: `${sourceComponent.type.toLowerCase()}.amazonaws.com`,
        source_arn: `\${aws_${sourceComponent.type.toLowerCase()}.${sourceName}.arn}`
      },
      description: `Allow ${sourceComponent.type} to invoke ${targetComponent.type}`
    }
  }
  
  if (targetComponent.type === 'Lambda' && sourceComponent.type === 'API Gateway') {
    return {
      type: 'aws_lambda_permission',
      name: `${targetName}_${sourceName}_permission`,
      properties: {
        statement_id: `AllowExecutionFrom${sourceComponent.type}`,
        action: 'lambda:InvokeFunction',
        function_name: `\${aws_lambda_function.${targetName}.function_name}`,
        principal: 'apigateway.amazonaws.com',
        source_arn: `\${aws_api_gateway_rest_api.${sourceName}.execution_arn}/*/*`
      },
      description: `Allow ${sourceComponent.type} to invoke ${targetComponent.type}`
    }
  }
  
  if (targetComponent.type === 'Lambda' && sourceComponent.type === 'SNS') {
    return {
      type: 'aws_lambda_permission',
      name: `${targetName}_${sourceName}_permission`,
      properties: {
        statement_id: `AllowExecutionFrom${sourceComponent.type}`,
        action: 'lambda:InvokeFunction',
        function_name: `\${aws_lambda_function.${targetName}.function_name}`,
        principal: 'sns.amazonaws.com',
        source_arn: `\${aws_sns_topic.${sourceName}.arn}`
      },
      description: `Allow ${sourceComponent.type} to invoke ${targetComponent.type}`
    }
  }
  
  if (targetComponent.type === 'Lambda' && sourceComponent.type === 'SQS') {
    return {
      type: 'aws_lambda_permission',
      name: `${targetName}_${sourceName}_permission`,
      properties: {
        statement_id: `AllowExecutionFrom${sourceComponent.type}`,
        action: 'lambda:InvokeFunction',
        function_name: `\${aws_lambda_function.${targetName}.function_name}`,
        principal: 'sqs.amazonaws.com',
        source_arn: `\${aws_sqs_queue.${sourceName}.arn}`
      },
      description: `Allow ${sourceComponent.type} to invoke ${targetComponent.type}`
    }
  }
  
  return null
}


// Generate a consolidated execution role policy for multiple target components
function generateConsolidatedExecutionRolePolicy(
  requirements: IAMPolicyRequirement[],
  sourceComponent: AWSComponent,
  targetComponents: AWSComponent[],
  policyKey: string
): GeneratedIAMPolicy | null {
  const sourceName = sourceComponent.properties.name || sourceComponent.type.toLowerCase().replace(/\s+/g, '_')
  const roleName = `${sourceComponent.type.toLowerCase()}_execution_role`
  
  // Consolidate all actions and resources
  const allActions = [...new Set(requirements.flatMap(req => req.actions))]
  const allResources = [...new Set(requirements.flatMap(req => req.resources))]
  
  // Generate resource ARNs for all target components
  const resourceArns = targetComponents.map(targetComponent => {
    const targetName = targetComponent.properties.name || targetComponent.type.toLowerCase().replace(/\s+/g, '_')
    return allResources.map(resource => 
      resource.replace('*', targetName)
    )
  }).flat()
  
  const consolidatedPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: allActions,
      Resource: resourceArns
    }]
  }
  
  return {
    type: 'aws_iam_role_policy',
    name: `${sourceName}_${policyKey}_access`,
    properties: {
      name: `${sourceName}-${policyKey}-access`,
      role: `\${aws_iam_role.${roleName}.id}`,
      policy: JSON.stringify(consolidatedPolicy, null, 2)
    },
    description: `Allow ${sourceComponent.type} to access ${targetComponents.map(tc => tc.type).join(', ')}`
  }
}

// Generate assume role policy for different services
function generateAssumeRolePolicy(serviceType: string): string {
  const servicePrincipal = getServicePrincipal(serviceType)
  
  const policy = {
    Version: '2012-10-17',
    Statement: [{
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: {
        Service: servicePrincipal
      }
    }]
  }
  
  return JSON.stringify(policy)
}

// Get the correct service principal for assume role policies
function getServicePrincipal(serviceType: string): string {
  const servicePrincipals: Record<string, string> = {
    'Lambda': 'lambda.amazonaws.com',
    'EC2': 'ec2.amazonaws.com',
    'ECS': 'ecs-tasks.amazonaws.com',
    'EKS': 'eks.amazonaws.com',
    'API Gateway': 'apigateway.amazonaws.com',
    'S3': 's3.amazonaws.com',
    'SNS': 'sns.amazonaws.com',
    'SQS': 'sqs.amazonaws.com',
    'CloudWatch': 'events.amazonaws.com'
  }
  
  return servicePrincipals[serviceType] || `${serviceType.toLowerCase()}.amazonaws.com`
}

// Generate basic execution role policy attachments
export function generateBasicExecutionRoleAttachments(context: IAMPolicyContext): GeneratedIAMPolicy[] {
  const attachments: GeneratedIAMPolicy[] = []
  
  // Add basic execution role for Lambda
  const hasLambda = context.components.some(comp => comp.type === 'Lambda')
  if (hasLambda && !context.existingPolicies.has('lambda_basic_execution')) {
    attachments.push({
      type: 'aws_iam_role_policy_attachment',
      name: 'lambda_basic_execution',
      properties: {
        role: '${aws_iam_role.lambda_execution_role.name}',
        policy_arn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      },
      description: 'Basic execution role for Lambda'
    })
    
    context.existingPolicies.add('lambda_basic_execution')
  }
  
  return attachments
}
