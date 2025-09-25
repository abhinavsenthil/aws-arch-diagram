import React, { useState, useRef } from 'react'
import { AWSComponent } from '../types'
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
  Ship,
  X,
  Settings
} from 'lucide-react'

interface AWSComponentNodeProps {
  component: AWSComponent
  isSelected: boolean
  isConnecting: boolean
  connectionStart: string | null
  onDrag: (componentId: string, position: { x: number; y: number }) => void
  onClick: (componentId: string) => void
  onConnectionStart: (componentId: string) => void
  onDelete: (componentId: string) => void
  onComponentUpdate: (componentId: string, updates: Partial<AWSComponent>) => void
}

const getComponentIcon = (type: string) => {
  const iconProps = { size: 24 }
  
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
    case 'IAM':
      return <Users {...iconProps} />
    case 'KMS':
      return <Key {...iconProps} />
    case 'Load Balancer':
      return <Activity {...iconProps} />
    case 'SQS':
      return <MessageSquare {...iconProps} />
    case 'SNS':
      return <Bell {...iconProps} />
    case 'SES':
      return <Mail {...iconProps} />
    case 'CloudWatch':
      return <Eye {...iconProps} />
    case 'ElasticSearch':
      return <Search {...iconProps} />
    case 'CodePipeline':
      return <GitBranch {...iconProps} />
    case 'CodeBuild':
      return <Wrench {...iconProps} />
    case 'CodeDeploy':
      return <Ship {...iconProps} />
    default:
      return <Cloud {...iconProps} />
  }
}

const getComponentColor = (type: string) => {
  if (type.includes('EC2') || type.includes('Lambda') || type.includes('Auto Scaling')) return 'aws-orange'
  if (type.includes('S3') || type.includes('DynamoDB') || type.includes('RDS') || type.includes('ElastiCache')) return 'aws-green'
  if (type.includes('VPC') || type.includes('Subnet') || type.includes('Internet') || type.includes('Route53') || type.includes('CloudFront') || type.includes('Load Balancer')) return 'aws-blue'
  if (type.includes('Security') || type.includes('IAM') || type.includes('KMS')) return 'aws-red'
  if (type.includes('API') || type.includes('SQS') || type.includes('SNS') || type.includes('SES')) return 'aws-purple'
  if (type.includes('CloudWatch') || type.includes('Code') || type.includes('ElasticSearch')) return 'aws-yellow'
  return 'aws-orange'
}

export const AWSComponentNode: React.FC<AWSComponentNodeProps> = ({
  component,
  isSelected,
  isConnecting,
  connectionStart,
  onDrag,
  onClick,
  onConnectionStart,
  onDelete,
  onComponentUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showSettings, setShowSettings] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      onClick(component.id)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const newPosition = {
        x: component.position.x + deltaX,
        y: component.position.y + deltaY
      }
      onDrag(component.id, newPosition)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isConnecting) {
      onConnectionStart(component.id)
    } else {
      onClick(component.id)
    }
  }

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isConnecting) {
      // Start connection mode on right click
      onConnectionStart(component.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(component.id)
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowSettings(!showSettings)
  }

  const color = getComponentColor(component.type)
  const canConnect = connectionStart && connectionStart !== component.id
  const isConnectionTarget = isConnecting && !connectionStart
  const [isDraggingConnection, setIsDraggingConnection] = useState(false)
  const [dragStartPort, setDragStartPort] = useState<'left' | 'right' | null>(null)

  return (
    <div
      ref={nodeRef}
      className={`absolute aws-component ${
        isSelected ? 'selected' : ''
      } ${canConnect ? 'border-aws-blue bg-blue-50' : ''} ${
        isConnectionTarget ? 'border-aws-green bg-green-50' : ''
      } ${isDragging ? 'shadow-lg' : ''}`}
      style={{
        left: component.position.x,
        top: component.position.y,
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <div className="flex items-center space-x-2 p-2">
        <div className={`text-${color} flex-shrink-0`}>
          {getComponentIcon(component.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{component.type}</p>
          <p className="text-xs text-gray-500 truncate">{component.id}</p>
        </div>
        
        {isSelected && (
          <div className="flex space-x-1">
            <button
              onClick={() => onConnectionStart(component.id)}
              className="p-1 text-aws-blue hover:text-blue-700 transition-colors"
              title="Connect to another component"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={handleSettings}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
              title="Delete"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Connection ports */}
      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-aws-green rounded-full border-2 border-white cursor-pointer hover:bg-green-600 transition-colors shadow-md z-10" 
           title="Invoked by other services"
           onMouseDown={(e) => {
             e.stopPropagation()
             setIsDraggingConnection(true)
             setDragStartPort('left')
             onConnectionStart(component.id)
           }}
      />
      <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-aws-orange rounded-full border-2 border-white cursor-pointer hover:bg-orange-600 transition-colors shadow-md z-10"
           title="Calls other services"
           onMouseDown={(e) => {
             e.stopPropagation()
             setIsDraggingConnection(true)
             setDragStartPort('right')
             onConnectionStart(component.id)
           }}
      />

      {/* Connection indicator */}
      {isConnecting && connectionStart === component.id && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-aws-blue rounded-full border-2 border-white animate-pulse" />
      )}

      {/* Settings panel */}
      {showSettings && isSelected && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-20">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Component Settings</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Name</label>
              <input
                type="text"
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                defaultValue={component.properties.name || component.type}
                onChange={(e) => {
                  onComponentUpdate(component.id, {
                    properties: { ...component.properties, name: e.target.value }
                  })
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Instance Type</label>
              <select className="w-full text-xs border border-gray-200 rounded px-2 py-1">
                <option>t2.micro</option>
                <option>t2.small</option>
                <option>t2.medium</option>
                <option>t2.large</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
