import React from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'
import { X, Zap, Shield, ArrowRight } from 'lucide-react'

interface ReactFlowCustomEdgeProps extends EdgeProps {
  data: {
    connectionType: 'trigger' | 'permission' | 'data_flow'
    direction: 'unidirectional' | 'bidirectional'
    fromPort?: 'left' | 'right'
    toPort?: 'left' | 'right'
    onDelete: () => void
  }
}

export const ReactFlowCustomEdge: React.FC<ReactFlowCustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const getEdgeStyle = () => {
    const baseStyle = {
      stroke: '#000000',
      strokeWidth: 2,
      ...style,
    }

    switch (data.connectionType) {
      case 'trigger':
        return {
          ...baseStyle,
          strokeDasharray: '8,4',
        }
      case 'permission':
        return {
          ...baseStyle,
          strokeDasharray: '4,8',
        }
      case 'data_flow':
        return {
          ...baseStyle,
          strokeDasharray: 'none',
        }
      default:
        return baseStyle
    }
  }

  const getConnectionIcon = () => {
    switch (data.connectionType) {
      case 'trigger':
        return <Zap size={12} />
      case 'permission':
        return <Shield size={12} />
      case 'data_flow':
        return <ArrowRight size={12} />
      default:
        return <ArrowRight size={12} />
    }
  }

  const edgeStyle = getEdgeStyle()

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center space-x-1"
        >
          {/* Connection type indicator */}
          <div className="bg-white rounded-full p-1 shadow-md border border-gray-200">
            {getConnectionIcon()}
          </div>
          
          {/* Delete button */}
          <button
            onClick={data.onDelete}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
