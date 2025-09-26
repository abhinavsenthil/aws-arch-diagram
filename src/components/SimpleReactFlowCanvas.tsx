import React, { useCallback, useMemo, useEffect } from 'react'
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

interface SimpleReactFlowCanvasProps {
  components: AWSComponent[]
  connections: CustomConnection[]
  onComponentSelect: (componentId: string) => void
  onComponentUpdate: (componentId: string, updates: Partial<AWSComponent>) => void
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

export const SimpleReactFlowCanvas: React.FC<SimpleReactFlowCanvasProps> = ({
  components,
  connections,
  onComponentSelect,
  onComponentUpdate,
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

  // Update nodes when components change
  useEffect(() => {
    const newNodes = components.map((component): Node => ({
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
    setNodes(newNodes)
  }, [components, selectedComponent, onComponentSelect, onComponentUpdate, onComponentDelete, setNodes])

  // Update edges when connections change
  useEffect(() => {
    const newEdges = connections.map((connection): Edge => ({
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
    setEdges(newEdges)
  }, [connections, onConnectionDelete, setEdges])

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
              Add components from the sidebar and connect them to build your architecture
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
