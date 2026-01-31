import { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { AWSComponent } from '../types'
import { X, Settings } from 'lucide-react'

interface ReactFlowAWSNodeProps extends NodeProps {
  data: {
    component: AWSComponent
    isSelected: boolean
    onSelect: () => void
    onUpdate: (updates: Partial<AWSComponent>) => void
    onDelete: () => void
  }
}

const getComponentIcon = (type: string) => {
  // Use actual AWS service icons from assets folder
  const getIconPath = (iconName: string) => `/assets/${iconName}.png`
  
  switch (type) {
    case 'EC2':
    case 'Auto Scaling Group':
      return (
        <img 
          src={getIconPath('EC2')} 
          alt="EC2" 
          className="w-4 h-4 object-contain"
        />
      )
    case 'S3':
      return (
        <img 
          src={getIconPath('Simple Storage Service')} 
          alt="S3" 
          className="w-4 h-4 object-contain"
        />
      )
    case 'DynamoDB':
      return (
        <img 
          src={getIconPath('DynamoDB')} 
          alt="DynamoDB" 
          className="w-4 h-4 object-contain"
        />
      )
    case 'Lambda':
      return (
        <img 
          src={getIconPath('Lambda')} 
          alt="Lambda" 
          className="w-4 h-4 object-contain"
        />
      )
    case 'API Gateway':
      return (
        <img 
          src={getIconPath('API Gateway')} 
          alt="API Gateway" 
          className="w-4 h-4 object-contain"
        />
      )
    case 'RDS':
    case 'ElastiCache':
      return (
        <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">RDS</span>
        </div>
      )
    case 'VPC':
    case 'Subnet':
    case 'Internet Gateway':
    case 'Load Balancer':
      return (
        <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">VPC</span>
        </div>
      )
    case 'Route53':
    case 'CloudFront':
      return (
        <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">R53</span>
        </div>
      )
    case 'Security Group':
    case 'IAM':
    case 'KMS':
      return (
        <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">IAM</span>
        </div>
      )
    case 'SQS':
      return (
        <div className="w-4 h-4 bg-pink-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">SQS</span>
        </div>
      )
    case 'SNS':
    case 'SES':
      return (
        <div className="w-4 h-4 bg-pink-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">SNS</span>
        </div>
      )
    case 'CloudWatch':
    case 'ElasticSearch':
      return (
        <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">CW</span>
        </div>
      )
    case 'CloudFormation':
    case 'CodePipeline':
    case 'CodeBuild':
    case 'CodeDeploy':
      return (
        <div className="w-4 h-4 bg-gray-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">CF</span>
        </div>
      )
    default:
      return (
        <div className="w-4 h-4 bg-gray-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">?</span>
        </div>
      )
  }
}

const getComponentColor = (type: string) => {
  switch (type) {
    case 'EC2':
    case 'Auto Scaling Group':
      return 'border-orange-200 hover:border-orange-300'
    case 'S3':
    case 'DynamoDB':
    case 'RDS':
    case 'ElastiCache':
      return 'border-green-200 hover:border-green-300'
    case 'Lambda':
      return 'border-yellow-200 hover:border-yellow-300'
    case 'VPC':
    case 'Subnet':
    case 'Internet Gateway':
      return 'border-blue-200 hover:border-blue-300'
    case 'API Gateway':
    case 'Route53':
    case 'CloudFront':
      return 'border-purple-200 hover:border-purple-300'
    case 'Security Group':
    case 'IAM':
    case 'KMS':
      return 'border-red-200 hover:border-red-300'
    case 'SQS':
    case 'SNS':
      return 'border-pink-200 hover:border-pink-300'
    case 'CloudWatch':
      return 'border-indigo-200 hover:border-indigo-300'
    default:
      return 'border-gray-200 hover:border-gray-300'
  }
}

export const ReactFlowAWSNode: React.FC<ReactFlowAWSNodeProps> = ({ data, selected }) => {
  const { component, isSelected, onSelect, onUpdate, onDelete } = data
  const [isHovered, setIsHovered] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowSettings(!showSettings)
  }

  const colorClass = getComponentColor(component.type)
  const isActive = selected || isSelected

  return (
    <div
      className={`aws-component relative w-20 h-16 rounded-lg border cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'shadow-xl scale-105 border-aws-orange bg-white' 
          : 'shadow-lg hover:shadow-xl hover:scale-105 bg-white'
      } ${colorClass}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-4 h-4 bg-aws-orange border-2 border-white rounded-full"
        style={{ left: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-4 h-4 bg-aws-orange border-2 border-white rounded-full"
        style={{ right: -8 }}
      />

      {/* Component content */}
      <div className="flex flex-col items-center justify-center h-full p-1">
        <div className="mb-0.5">
          {getComponentIcon(component.type)}
        </div>
        <div className="text-xs font-medium text-center leading-tight text-gray-800">
          {component.type}
        </div>
        {component.properties.name && (
          <div className="text-xs text-gray-500 text-center truncate w-full">
            {component.properties.name}
          </div>
        )}
      </div>

      {/* Hover controls */}
      {isHovered && (
        <div className="absolute -top-3 -right-3 flex space-x-1">
          <button
            onClick={handleSettings}
            className="w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Settings size={14} className="text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="w-7 h-7 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-10">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">Settings</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
              <input
                type="text"
                value={component.properties.name || ''}
                onChange={(e) => onUpdate({ properties: { ...component.properties, name: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-aws-orange focus:border-transparent"
                placeholder="Name"
              />
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
