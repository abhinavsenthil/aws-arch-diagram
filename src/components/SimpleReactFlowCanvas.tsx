import { useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
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
import { VPCGroupNode } from './VPCGroupNode'

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

// Components that should be rendered as group/container nodes
const GROUP_NODE_TYPES = ['VPC', 'Subnet', 'Security Group']

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  awsComponent: ReactFlowAWSNode,
  vpcGroup: VPCGroupNode,
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
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Helper to determine node type
  const getNodeType = (componentType: string): string => {
    return GROUP_NODE_TYPES.includes(componentType) ? 'vpcGroup' : 'awsComponent'
  }

  // Helper to get z-index for proper layering (groups should be behind regular nodes)
  const getZIndex = (componentType: string): number => {
    if (componentType === 'VPC') return -2
    if (componentType === 'Subnet') return -1
    if (componentType === 'Security Group') return -1
    return 0
  }

  // Update nodes when components change
  useEffect(() => {
    // Sort components so group nodes come first (render behind)
    const sortedComponents = [...components].sort((a, b) => {
      const aIsGroup = GROUP_NODE_TYPES.includes(a.type)
      const bIsGroup = GROUP_NODE_TYPES.includes(b.type)
      if (aIsGroup && !bIsGroup) return -1
      if (!aIsGroup && bIsGroup) return 1
      // VPC should come before Subnet
      if (a.type === 'VPC' && b.type !== 'VPC') return -1
      if (a.type !== 'VPC' && b.type === 'VPC') return 1
      return 0
    })

    const newNodes = sortedComponents.map((component): Node => ({
      id: component.id,
      type: getNodeType(component.type),
      position: component.position,
      zIndex: getZIndex(component.type),
      data: {
        component,
        isSelected: selectedComponent === component.id,
        onSelect: () => onComponentSelect(component.id),
        onUpdate: (updates: Partial<AWSComponent>) => onComponentUpdate(component.id, updates),
        onDelete: () => onComponentDelete(component.id),
      },
      // Make group nodes act as containers
      ...(GROUP_NODE_TYPES.includes(component.type) && {
        style: { zIndex: getZIndex(component.type) },
      }),
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
