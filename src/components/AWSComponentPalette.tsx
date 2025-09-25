import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ComponentType } from '../types'
import { 
  Server, 
  Database, 
  Zap, 
  Globe, 
  Cloud, 
  Shield, 
  Users, 
  Lock,
  Activity,
  MessageSquare,
  Bell,
  Eye,
  Key,
  Search,
  Mail,
  FileText,
  GitBranch,
  Wrench,
  Ship
} from 'lucide-react'

interface DraggableComponentProps {
  type: ComponentType
  icon: React.ReactNode
  color: string
  description: string
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ type, icon, color, description }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: type,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 m-2 bg-white border-2 border-gray-200 rounded-lg cursor-move hover:border-aws-orange hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`text-${color} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{type}</p>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </div>
  )
}

const componentCategories = [
  {
    title: 'Compute',
    components: [
      { type: 'EC2' as ComponentType, icon: <Server size={20} />, color: 'aws-orange', description: 'Virtual servers' },
      { type: 'Lambda' as ComponentType, icon: <Zap size={20} />, color: 'aws-orange', description: 'Serverless functions' },
      { type: 'Auto Scaling Group' as ComponentType, icon: <Activity size={20} />, color: 'aws-orange', description: 'Auto scaling' },
    ]
  },
  {
    title: 'Storage',
    components: [
      { type: 'S3' as ComponentType, icon: <Database size={20} />, color: 'aws-green', description: 'Object storage' },
      { type: 'DynamoDB' as ComponentType, icon: <Database size={20} />, color: 'aws-green', description: 'NoSQL database' },
      { type: 'RDS' as ComponentType, icon: <Database size={20} />, color: 'aws-green', description: 'Relational database' },
      { type: 'ElastiCache' as ComponentType, icon: <Database size={20} />, color: 'aws-green', description: 'In-memory cache' },
    ]
  },
  {
    title: 'Networking',
    components: [
      { type: 'VPC' as ComponentType, icon: <Cloud size={20} />, color: 'aws-blue', description: 'Virtual private cloud' },
      { type: 'Subnet' as ComponentType, icon: <Cloud size={20} />, color: 'aws-blue', description: 'Network subnet' },
      { type: 'Internet Gateway' as ComponentType, icon: <Globe size={20} />, color: 'aws-blue', description: 'Internet access' },
      { type: 'Load Balancer' as ComponentType, icon: <Activity size={20} />, color: 'aws-blue', description: 'Traffic distribution' },
      { type: 'Route53' as ComponentType, icon: <Globe size={20} />, color: 'aws-blue', description: 'DNS service' },
      { type: 'CloudFront' as ComponentType, icon: <Globe size={20} />, color: 'aws-blue', description: 'CDN service' },
    ]
  },
  {
    title: 'Security',
    components: [
      { type: 'Security Group' as ComponentType, icon: <Shield size={20} />, color: 'aws-red', description: 'Firewall rules' },
      { type: 'IAM' as ComponentType, icon: <Users size={20} />, color: 'aws-red', description: 'Access management' },
      { type: 'KMS' as ComponentType, icon: <Key size={20} />, color: 'aws-red', description: 'Key management' },
    ]
  },
  {
    title: 'Application Services',
    components: [
      { type: 'API Gateway' as ComponentType, icon: <Globe size={20} />, color: 'aws-purple', description: 'API management' },
      { type: 'SQS' as ComponentType, icon: <MessageSquare size={20} />, color: 'aws-purple', description: 'Message queue' },
      { type: 'SNS' as ComponentType, icon: <Bell size={20} />, color: 'aws-purple', description: 'Notification service' },
      { type: 'SES' as ComponentType, icon: <Mail size={20} />, color: 'aws-purple', description: 'Email service' },
    ]
  },
  {
    title: 'Monitoring & DevOps',
    components: [
      { type: 'CloudWatch' as ComponentType, icon: <Eye size={20} />, color: 'aws-yellow', description: 'Monitoring' },
      { type: 'CodePipeline' as ComponentType, icon: <GitBranch size={20} />, color: 'aws-yellow', description: 'CI/CD pipeline' },
      { type: 'CodeBuild' as ComponentType, icon: <Wrench size={20} />, color: 'aws-yellow', description: 'Build service' },
      { type: 'CodeDeploy' as ComponentType, icon: <Ship size={20} />, color: 'aws-yellow', description: 'Deployment service' },
    ]
  }
]

export const AWSComponentPalette: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {componentCategories.map((category, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {category.title}
          </h3>
          <div className="space-y-2">
            {category.components.map((component) => (
              <DraggableComponent
                key={component.type}
                type={component.type}
                icon={component.icon}
                color={component.color}
                description={component.description}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
