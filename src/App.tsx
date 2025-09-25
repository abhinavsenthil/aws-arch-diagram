import React, { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { AWSComponentPalette } from './components/AWSComponentPalette'
import { ArchitectureCanvas } from './components/ArchitectureCanvas'
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
  const [activeComponent, setActiveComponent] = useState<AWSComponent | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const componentType = active.id as ComponentType
    const newComponent: AWSComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      position: { x: 100, y: 100 },
      properties: {}
    }
    setActiveComponent(newComponent)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    
    if (over && over.id === 'canvas') {
      // Get the canvas element to calculate position
      const canvasElement = document.getElementById('canvas')
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect()
        const newComponent: AWSComponent = {
          id: `${active.id}-${Date.now()}`,
          type: active.id as ComponentType,
          position: { 
            x: Math.max(0, delta.x - 50), 
            y: Math.max(0, delta.y - 50)
          },
          properties: {}
        }
        setComponents(prev => [...prev, newComponent])
      }
    }
    
    setActiveComponent(null)
  }

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

  const handleConnectionCreate = (from: string, to: string, fromPort: 'left' | 'right' = 'right', toPort: 'left' | 'right' = 'left') => {
    const fromComponent = components.find(c => c.id === from)
    const toComponent = components.find(c => c.id === to)
    
    if (!fromComponent || !toComponent || from === to) return

    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      (conn.from === from && conn.to === to) || 
      (conn.from === to && conn.to === from)
    )
    
    if (existingConnection) return

    // Determine connection type based on component types and ports
    let connectionType: 'trigger' | 'permission' | 'data_flow' = 'data_flow'
    let direction: 'unidirectional' | 'bidirectional' = 'unidirectional'

    // Right port (calls) -> Left port (invoked by): Trigger
    if (fromPort === 'right' && toPort === 'left') {
      if (fromComponent.type === 'S3' && toComponent.type === 'Lambda') {
        connectionType = 'trigger'
      } else if (fromComponent.type === 'API Gateway' && toComponent.type === 'Lambda') {
        connectionType = 'trigger'
      } else {
        connectionType = 'data_flow'
      }
    }
    // Right port (calls) -> Right port (calls): Permission
    else if (fromPort === 'right' && toPort === 'right') {
      connectionType = 'permission'
    }
    // Left port (invoked by) -> Left port (invoked by): Data flow
    else if (fromPort === 'left' && toPort === 'left') {
      connectionType = 'data_flow'
      direction = 'bidirectional'
    }
    // Default: data flow
    else {
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
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Left Sidebar - Component Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">AWS Architecture Builder</h1>
            <p className="text-sm text-gray-600">Drag components to build your architecture</p>
          </div>
          <AWSComponentPalette />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex overflow-visible">
          <div className="flex-1 overflow-visible">
            <ArchitectureCanvas
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

        <DragOverlay>
          {activeComponent && (
            <div className="aws-component shadow-2xl scale-110 opacity-90">
              <div className="flex items-center space-x-2 p-2">
                <div className="text-aws-orange">
                  {getComponentIcon(activeComponent.type)}
                </div>
                <span className="font-medium">{activeComponent.type}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default App
