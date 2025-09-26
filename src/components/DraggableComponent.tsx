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

interface DraggableComponentProps {
  type: ComponentType
  onDragStart: (type: ComponentType) => void
  onDragEnd: () => void
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
      return 'bg-orange-100 border-orange-300 text-orange-800'
    case 'S3':
    case 'DynamoDB':
    case 'RDS':
    case 'ElastiCache':
      return 'bg-green-100 border-green-300 text-green-800'
    case 'Lambda':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    case 'VPC':
    case 'Subnet':
    case 'Internet Gateway':
      return 'bg-blue-100 border-blue-300 text-blue-800'
    case 'API Gateway':
    case 'Route53':
    case 'CloudFront':
      return 'bg-purple-100 border-purple-300 text-purple-800'
    case 'Security Group':
    case 'IAM':
    case 'KMS':
      return 'bg-red-100 border-red-300 text-red-800'
    case 'SQS':
    case 'SNS':
      return 'bg-pink-100 border-pink-300 text-pink-800'
    case 'CloudWatch':
      return 'bg-indigo-100 border-indigo-300 text-indigo-800'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800'
  }
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({ 
  type, 
  onDragStart, 
  onDragEnd 
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onDragStart(type)
  }

  const handleMouseUp = () => {
    onDragEnd()
  }

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-move transition-all duration-200 hover:shadow-md hover:scale-105 ${getComponentColor(type)}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', type)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(type)
      }}
      onDragEnd={onDragEnd}
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
    </div>
  )
}
