import React from 'react'
import { ComponentType } from '../types'
import { 
  Server, 
  Database, 
  Zap, 
  Globe, 
  Cloud, 
  Shield, 
  Users, 
  Activity,
  MessageSquare,
  Bell,
  Eye,
  Key,
  Search,
  Mail,
  GitBranch,
  Wrench,
  Ship
} from 'lucide-react'

interface SimpleComponentPaletteProps {
  onComponentAdd: (type: ComponentType) => void
}

const getComponentIcon = (type: ComponentType) => {
  const iconProps = { size: 20 }
  
  switch (type) {
    case 'EC2':
    case 'Auto Scaling Group':
      return <Server {...iconProps} />
    case 'S3':
    case 'DynamoDB':
    case 'RDS':
    case 'ElastiCache':
      return <Database {...iconProps} />
    case 'Lambda':
      return <Zap {...iconProps} />
    case 'VPC':
    case 'Subnet':
      return <Cloud {...iconProps} />
    case 'Internet Gateway':
    case 'Route53':
    case 'CloudFront':
    case 'API Gateway':
      return <Globe {...iconProps} />
    case 'Security Group':
      return <Shield {...iconProps} />
    case 'SQS':
      return <MessageSquare {...iconProps} />
    case 'SNS':
      return <Bell {...iconProps} />
    case 'CloudWatch':
      return <Activity {...iconProps} />
    case 'IAM':
      return <Key {...iconProps} />
    case 'KMS':
      return <Eye {...iconProps} />
    case 'ElasticSearch':
      return <Search {...iconProps} />
    case 'SES':
      return <Mail {...iconProps} />
    case 'CloudFormation':
      return <GitBranch {...iconProps} />
    case 'CodePipeline':
    case 'CodeBuild':
    case 'CodeDeploy':
      return <Wrench {...iconProps} />
    case 'Load Balancer':
      return <Users {...iconProps} />
    default:
      return <Ship {...iconProps} />
  }
}

const getComponentColor = (type: ComponentType) => {
  switch (type) {
    case 'EC2':
    case 'Auto Scaling Group':
      return 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200'
    case 'S3':
    case 'DynamoDB':
    case 'RDS':
    case 'ElastiCache':
      return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
    case 'Lambda':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
    case 'VPC':
    case 'Subnet':
    case 'Internet Gateway':
      return 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
    case 'API Gateway':
    case 'Route53':
    case 'CloudFront':
      return 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200'
    case 'Security Group':
    case 'IAM':
    case 'KMS':
      return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
    case 'SQS':
    case 'SNS':
      return 'bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-200'
    case 'CloudWatch':
      return 'bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-200'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
  }
}

const componentCategories = [
  {
    title: 'Compute',
    components: ['EC2', 'Lambda', 'Auto Scaling Group'] as ComponentType[]
  },
  {
    title: 'Storage',
    components: ['S3', 'DynamoDB', 'RDS', 'ElastiCache'] as ComponentType[]
  },
  {
    title: 'Networking',
    components: ['VPC', 'Subnet', 'Internet Gateway', 'Security Group', 'Load Balancer'] as ComponentType[]
  },
  {
    title: 'API & CDN',
    components: ['API Gateway', 'Route53', 'CloudFront'] as ComponentType[]
  },
  {
    title: 'Messaging',
    components: ['SQS', 'SNS', 'SES'] as ComponentType[]
  },
  {
    title: 'Monitoring',
    components: ['CloudWatch'] as ComponentType[]
  },
  {
    title: 'Security',
    components: ['IAM', 'KMS'] as ComponentType[]
  },
  {
    title: 'DevOps',
    components: ['CloudFormation', 'CodePipeline', 'CodeBuild', 'CodeDeploy'] as ComponentType[]
  }
]

export const SimpleComponentPalette: React.FC<SimpleComponentPaletteProps> = ({ onComponentAdd }) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AWS Components</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click components to add them to your architecture
        </p>
        
        {componentCategories.map((category) => (
          <div key={category.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{category.title}</h3>
            <div className="grid grid-cols-1 gap-2">
              {category.components.map((type) => (
                <button
                  key={type}
                  onClick={() => onComponentAdd(type)}
                  className={`p-3 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:scale-105 ${getComponentColor(type)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-aws-orange">
                      {getComponentIcon(type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{type}</div>
                      <div className="text-xs opacity-75">
                        {type === 'EC2' && 'Virtual server'}
                        {type === 'S3' && 'Object storage'}
                        {type === 'Lambda' && 'Serverless function'}
                        {type === 'RDS' && 'Managed database'}
                        {type === 'DynamoDB' && 'NoSQL database'}
                        {type === 'API Gateway' && 'API management'}
                        {type === 'VPC' && 'Virtual network'}
                        {type === 'SQS' && 'Message queue'}
                        {type === 'SNS' && 'Notification service'}
                        {type === 'CloudWatch' && 'Monitoring'}
                        {type === 'IAM' && 'Identity & access'}
                        {type === 'Route53' && 'DNS service'}
                        {type === 'CloudFront' && 'CDN'}
                        {type === 'Security Group' && 'Firewall rules'}
                        {type === 'Load Balancer' && 'Traffic distribution'}
                        {type === 'Auto Scaling Group' && 'Auto scaling'}
                        {type === 'ElastiCache' && 'In-memory cache'}
                        {type === 'KMS' && 'Key management'}
                        {type === 'ElasticSearch' && 'Search service'}
                        {type === 'SES' && 'Email service'}
                        {type === 'CloudFormation' && 'Infrastructure as code'}
                        {type === 'CodePipeline' && 'CI/CD pipeline'}
                        {type === 'CodeBuild' && 'Build service'}
                        {type === 'CodeDeploy' && 'Deployment service'}
                        {type === 'Subnet' && 'Network subnet'}
                        {type === 'Internet Gateway' && 'Internet access'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
