import { useState } from 'react'
import { SimpleComponentPalette } from './components/SimpleComponentPalette'
import { SimpleReactFlowCanvas } from './components/SimpleReactFlowCanvas'
import { TerraformCodePanel } from './components/TerraformCodePanel'
import { AWSComponent, ComponentType } from './types'

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
    // Get default properties based on component type
    const getDefaultProperties = (componentType: ComponentType) => {
      const count = components.filter(c => c.type === componentType).length + 1
      const baseName = `${componentType} ${count}`
      
      switch (componentType) {
        case 'VPC':
          return {
            name: `my-vpc-${count}`,
            cidr: '10.0.0.0/16',
            width: 400,
            height: 300
          }
        case 'Subnet':
          return {
            name: `subnet-${count}`,
            cidr: `10.0.${count}.0/24`,
            availabilityZone: 'us-west-2a',
            isPublic: true,
            width: 250,
            height: 180
          }
        case 'Security Group':
          return {
            name: `sg-${count}`,
            width: 200,
            height: 150
          }
        case 'Lambda':
          return {
            name: `my-function-${count}`,
            runtime: 'python3.9',
            handler: 'index.handler'
          }
        case 'S3':
          return {
            name: `my-bucket-${count}`
          }
        case 'RDS':
          return {
            name: `my-database-${count}`,
            engine: 'mysql'
          }
        case 'DynamoDB':
          return {
            name: `my-table-${count}`
          }
        case 'API Gateway':
          return {
            name: `my-api-${count}`
          }
        default:
          return {
            name: baseName
          }
      }
    }

    // Calculate position - place group nodes more to the left/top
    const isGroupNode = ['VPC', 'Subnet', 'Security Group'].includes(type)
    const baseX = isGroupNode ? 100 : 300
    const baseY = isGroupNode ? 100 : 200
    
    const newComponent: AWSComponent = {
      id: `${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      type,
      position: { 
        x: baseX + Math.random() * 150, 
        y: baseY + Math.random() * 150 
      },
      properties: getDefaultProperties(type)
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
