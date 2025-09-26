import React, { useState } from 'react'
import { SimpleComponentPalette } from './components/SimpleComponentPalette'
import { SimpleReactFlowCanvas } from './components/SimpleReactFlowCanvas'
import { TerraformCodePanel } from './components/TerraformCodePanel'
import { AWSComponent, ComponentType } from './types'
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

const getComponentIcon = (type: string) => {
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

function App() {
  const [components, setComponents] = useState<AWSComponent[]>([])
  const [connections, setConnections] = useState<Array<{from: string, to: string}>>([])
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  const handleComponentSelect = (componentId: string) => {
    setSelectedComponent(componentId)
  }

  const handleComponentUpdate = (componentId: string, updates: Partial<AWSComponent>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      )
    )
  }

  const handleComponentDelete = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId))
    setConnections(prev => prev.filter(conn => conn.from !== componentId && conn.to !== componentId))
    setSelectedComponent(null)
  }

  const handleComponentAdd = (type: ComponentType) => {
    const newComponent: AWSComponent = {
      id: `${type.toLowerCase()}_${Date.now()}`,
      type,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      properties: {
        name: `${type} ${components.filter(c => c.type === type).length + 1}`
      }
    }
    setComponents(prev => [...prev, newComponent])
  }

  const handleConnectionCreate = (from: string, to: string) => {
    const fromComponent = components.find(c => c.id === from)
    const toComponent = components.find(c => c.id === to)
    
    if (!fromComponent || !toComponent || from === to) return

    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      (conn.from === from && conn.to === to) || 
      (conn.from === to && conn.to === from)
    )
    
    if (existingConnection) return

    // Determine connection type based on component types
    let connectionType: 'trigger' | 'permission' | 'data_flow' = 'data_flow'
    let direction: 'unidirectional' | 'bidirectional' = 'unidirectional'
    let fromPort: 'left' | 'right' = 'right'
    let toPort: 'left' | 'right' = 'left'

    // Determine connection type based on component types
    if (fromComponent.type === 'S3' && toComponent.type === 'Lambda') {
      connectionType = 'trigger'
    } else if (fromComponent.type === 'API Gateway' && toComponent.type === 'Lambda') {
      connectionType = 'trigger'
    } else if (fromComponent.type === 'Lambda' && toComponent.type === 'S3') {
      connectionType = 'permission'
    } else if (fromComponent.type === 'Lambda' && toComponent.type === 'DynamoDB') {
      connectionType = 'permission'
    } else if (fromComponent.type === 'Lambda' && toComponent.type === 'RDS') {
      connectionType = 'permission'
    } else {
      connectionType = 'data_flow'
    }

    setConnections(prev => [...prev, { 
      from, 
      to, 
      type: connectionType,
      direction,
      fromPort,
      toPort
    }])
  }

  const handleConnectionDelete = (from: string, to: string) => {
    setConnections(prev => prev.filter(conn => !(conn.from === from && conn.to === to)))
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Left Sidebar - Component Palette */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">AWS Architecture Builder</h1>
            <p className="text-sm text-gray-600">Click components to add them to your architecture</p>
        </div>
          <SimpleComponentPalette onComponentAdd={handleComponentAdd} />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-visible">
        <div className="flex-1 overflow-visible">
            <SimpleReactFlowCanvas
              components={components}
              connections={connections}
              onComponentSelect={handleComponentSelect}
              onComponentUpdate={handleComponentUpdate}
              onComponentDelete={handleComponentDelete}
              onConnectionCreate={handleConnectionCreate}
              onConnectionDelete={handleConnectionDelete}
              selectedComponent={selectedComponent}
            />
        </div>
        
        {/* Right Sidebar - Terraform Code */}
        <div className="w-96 bg-white border-l border-gray-200">
          <TerraformCodePanel 
            components={components} 
            connections={connections}
          />
        </div>
      </div>
    </div>
  )
}

export default App
