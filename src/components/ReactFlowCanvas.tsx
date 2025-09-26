import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AWSComponent, Connection as CustomConnection } from '../types'
import { ReactFlowAWSNode } from './ReactFlowAWSNode'
import { ReactFlowCustomEdge } from './ReactFlowCustomEdge'

interface ReactFlowCanvasProps {
  components: AWSComponent[]
  connections: CustomConnection[]
  onComponentSelect: (componentId: string) => void
  onComponentUpdate: (componentId: string, updates: Partial<AWSComponent>) => void
  onComponentAdd: (component: AWSComponent) => void
  onComponentDelete: (componentId: string) => void
  onConnectionCreate: (from: string, to: string) => void
  onConnectionDelete: (from: string, to: string) => void
  selectedComponent: string | null
}

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  awsComponent: ReactFlowAWSNode,
}

// Custom edge types for React Flow
const edgeTypes: EdgeTypes = {
  custom: ReactFlowCustomEdge,
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  components,
  connections,
  onComponentSelect,
  onComponentUpdate,
  onComponentAdd,
  onComponentDelete,
  onConnectionCreate,
  onConnectionDelete,
  selectedComponent
}) => {
  // Convert AWS components to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return components.map((component): Node => ({
      id: component.id,
      type: 'awsComponent',
      position: component.position,
      data: {
        component,
        isSelected: selectedComponent === component.id,
        onSelect: () => onComponentSelect(component.id),
        onUpdate: (updates: Partial<AWSComponent>) => onComponentUpdate(component.id, updates),
        onDelete: () => onComponentDelete(component.id),
      },
    }))
  }, [components, selectedComponent, onComponentSelect, onComponentUpdate, onComponentDelete])

  // Convert custom connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((connection): Edge => ({
      id: `${connection.from}-${connection.to}`,
      source: connection.from,
      target: connection.to,
      type: 'custom',
      data: {
        connectionType: connection.type,
        direction: connection.direction,
        fromPort: connection.fromPort,
        toPort: connection.toPort,
        onDelete: () => onConnectionDelete(connection.from, connection.to),
      },
      style: {
        stroke: '#000000',
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 6,
        height: 6,
        color: '#000000',
      },
    }))
  }, [connections, onConnectionDelete])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Handle node position changes
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    const component = components.find(c => c.id === node.id)
    if (component) {
      onComponentUpdate(component.id, { position: node.position })
    }
  }, [components, onComponentUpdate])

  // Handle new connections
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      onConnectionCreate(params.source, params.target)
    }
  }, [onConnectionCreate])

  // Handle drag and drop from palette
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect()
    const type = event.dataTransfer.getData('application/reactflow')
    
    if (typeof type === 'undefined' || !type) {
      return
    }

    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    }

    // Create new component
    const newComponent: AWSComponent = {
      id: `${type.toLowerCase()}_${Date.now()}`,
      type: type as ComponentType,
      position,
      properties: {
        name: `${type} ${components.filter(c => c.type === type).length + 1}`
      }
    }

    // Add component through the parent
    onComponentAdd(newComponent)
  }, [components, onComponentAdd])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onComponentSelect(node.id)
  }, [onComponentSelect])

  // Handle edge selection
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // You can add edge selection logic here if needed
  }, [])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left">
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <h3 className="text-lg font-semibold mb-2">AWS Architecture Builder</h3>
            <p className="text-sm text-gray-600">
              Drag components from the sidebar and connect them to build your architecture
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
