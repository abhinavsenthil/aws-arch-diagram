import React, { useState } from 'react'
import { X, ArrowRight, Zap, Shield } from 'lucide-react'

interface ConnectionLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  connectionType: 'trigger' | 'permission' | 'data_flow'
  direction: 'unidirectional' | 'bidirectional'
  fromPort?: 'left' | 'right'
  toPort?: 'left' | 'right'
  onDelete: () => void
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  from, 
  to, 
  connectionType, 
  direction,
  fromPort = 'right',
  toPort = 'left',
  onDelete 
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Calculate the path for the connection line based on ports
  const fromX = fromPort === 'left' ? from.x - 2 : from.x + 100 + 2
  const toX = toPort === 'left' ? to.x - 2 : to.x + 100 + 2
  const fromY = from.y + 25
  const toY = to.y + 25
  
  // Create a simple straight line
  const pathData = `M ${fromX} ${fromY} L ${toX} ${toY}`

  // Get connection style based on type
  const getConnectionStyle = () => {
    switch (connectionType) {
      case 'trigger':
        return {
          stroke: isHovered ? '#000000' : '#000000',
          strokeDasharray: '8,4',
          strokeWidth: isHovered ? 2.5 : 2
        }
      case 'permission':
        return {
          stroke: isHovered ? '#000000' : '#000000',
          strokeDasharray: '4,8',
          strokeWidth: isHovered ? 2.5 : 2
        }
      case 'data_flow':
        return {
          stroke: isHovered ? '#000000' : '#000000',
          strokeDasharray: 'none',
          strokeWidth: isHovered ? 2.5 : 2
        }
      default:
        return {
          stroke: isHovered ? '#000000' : '#000000',
          strokeDasharray: 'none',
          strokeWidth: isHovered ? 2.5 : 2
        }
    }
  }

  const getConnectionIcon = () => {
    switch (connectionType) {
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

  const style = getConnectionStyle()

  // Calculate arrow head position and direction
  const arrowSize = 5
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const arrowX = toX - Math.cos(angle) * arrowSize
  const arrowY = toY - Math.sin(angle) * arrowSize
  
  const arrowPath = `M ${arrowX} ${arrowY} L ${toX} ${toY} L ${arrowX + Math.cos(angle + Math.PI/3) * arrowSize} ${arrowY + Math.sin(angle + Math.PI/3) * arrowSize} Z`

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${connectionType}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,4 L5,2 z"
            fill={style.stroke}
          />
        </marker>
      </defs>
      
      <path
        d={pathData}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        fill="none"
        markerEnd={`url(#arrow-${connectionType})`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Connection endpoints */}
      <circle
        cx={fromX}
        cy={fromY}
        r={3}
        fill={style.stroke}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <circle
        cx={toX}
        cy={toY}
        r={3}
        fill={style.stroke}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Connection type indicator */}
      <g transform={`translate(${(fromX + toX) / 2}, ${(fromY + toY) / 2})`}>
        <circle
          r={10}
          fill="white"
          stroke={style.stroke}
          strokeWidth={1.5}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          className="cursor-pointer"
          onClick={onDelete}
        >
          {getConnectionIcon()}
        </text>
      </g>

      {/* Delete button */}
      {isHovered && (
        <g>
          <circle
            cx={(fromX + toX) / 2}
            cy={(fromY + toY) / 2 - 30}
            r={10}
            className="fill-white stroke-red-500 stroke-1.5"
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 - 30}
            textAnchor="middle"
            dominantBaseline="middle"
            className="cursor-pointer"
            onClick={onDelete}
          >
            <X size={10} />
          </text>
        </g>
      )}
    </g>
  )
}
