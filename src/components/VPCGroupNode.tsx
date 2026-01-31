import { useState } from 'react'
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow'
import { AWSComponent } from '../types'
import { X, Settings, Cloud, Layers } from 'lucide-react'

interface VPCGroupNodeProps extends NodeProps {
  data: {
    component: AWSComponent
    isSelected: boolean
    onSelect: () => void
    onUpdate: (updates: Partial<AWSComponent>) => void
    onDelete: () => void
  }
}

// Get styling based on component type
const getGroupStyle = (type: string) => {
  switch (type) {
    case 'VPC':
      return {
        background: 'rgba(147, 51, 234, 0.08)', // purple-600 with low opacity
        borderColor: 'rgb(147, 51, 234)', // purple-600
        headerBg: 'rgb(147, 51, 234)',
        icon: <Cloud size={16} className="text-white" />,
        label: 'VPC'
      }
    case 'Subnet':
      return {
        background: 'rgba(34, 197, 94, 0.08)', // green-500 with low opacity
        borderColor: 'rgb(34, 197, 94)', // green-500
        headerBg: 'rgb(34, 197, 94)',
        icon: <Layers size={16} className="text-white" />,
        label: 'Subnet'
      }
    case 'Security Group':
      return {
        background: 'rgba(239, 68, 68, 0.06)', // red-500 with low opacity
        borderColor: 'rgb(239, 68, 68)', // red-500
        headerBg: 'rgb(239, 68, 68)',
        icon: <Layers size={16} className="text-white" />,
        label: 'Security Group'
      }
    default:
      return {
        background: 'rgba(107, 114, 128, 0.08)', // gray-500 with low opacity
        borderColor: 'rgb(107, 114, 128)', // gray-500
        headerBg: 'rgb(107, 114, 128)',
        icon: <Cloud size={16} className="text-white" />,
        label: type
      }
  }
}

export const VPCGroupNode: React.FC<VPCGroupNodeProps> = ({ data, selected }) => {
  const { component, isSelected, onSelect, onUpdate, onDelete } = data
  const [isHovered, setIsHovered] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const style = getGroupStyle(component.type)
  const isActive = selected || isSelected
  
  // Get dimensions from properties or use defaults
  const width = component.properties.width || 300
  const height = component.properties.height || 200

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

  return (
    <>
      {/* Node Resizer - allows resizing the group */}
      <NodeResizer
        color={style.borderColor}
        isVisible={isActive}
        minWidth={200}
        minHeight={150}
        onResize={(_, params) => {
          onUpdate({ 
            properties: { 
              ...component.properties, 
              width: params.width, 
              height: params.height 
            } 
          })
        }}
      />
      
      <div
        className={`vpc-group-node relative rounded-lg transition-all duration-200 ${
          isActive ? 'ring-2 ring-offset-2' : ''
        }`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: style.background,
          border: `2px dashed ${style.borderColor}`,
          ringColor: style.borderColor,
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection handles on all sides */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3 h-3 border-2 border-white rounded-full"
          style={{ backgroundColor: style.borderColor, left: -6 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-3 h-3 border-2 border-white rounded-full"
          style={{ backgroundColor: style.borderColor, right: -6 }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3 h-3 border-2 border-white rounded-full"
          style={{ backgroundColor: style.borderColor, top: -6 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="w-3 h-3 border-2 border-white rounded-full"
          style={{ backgroundColor: style.borderColor, bottom: -6 }}
        />

        {/* Header bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-8 rounded-t-md flex items-center px-3 gap-2"
          style={{ backgroundColor: style.headerBg }}
        >
          {style.icon}
          <span className="text-white text-sm font-semibold">
            {component.properties.name || style.label}
          </span>
          {component.type === 'VPC' && component.properties.cidr && (
            <span className="text-white/70 text-xs ml-auto">
              {component.properties.cidr}
            </span>
          )}
          {component.type === 'Subnet' && component.properties.availabilityZone && (
            <span className="text-white/70 text-xs ml-auto">
              {component.properties.availabilityZone}
            </span>
          )}
        </div>

        {/* Info badge */}
        <div 
          className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded"
          style={{ 
            backgroundColor: `${style.borderColor}20`,
            color: style.borderColor 
          }}
        >
          {component.type === 'VPC' && 'Drop components inside'}
          {component.type === 'Subnet' && 'Public/Private Subnet'}
          {component.type === 'Security Group' && 'Firewall Rules'}
        </div>

        {/* Hover controls */}
        {isHovered && (
          <div className="absolute -top-3 -right-3 flex space-x-1 z-50">
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
          <div className="absolute top-10 right-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              {component.type} Settings
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input
                  type="text"
                  value={component.properties.name || ''}
                  onChange={(e) => onUpdate({ properties: { ...component.properties, name: e.target.value } })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`My ${component.type}`}
                />
              </div>
              
              {component.type === 'VPC' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">CIDR Block</label>
                  <input
                    type="text"
                    value={component.properties.cidr || '10.0.0.0/16'}
                    onChange={(e) => onUpdate({ properties: { ...component.properties, cidr: e.target.value } })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10.0.0.0/16"
                  />
                </div>
              )}
              
              {component.type === 'Subnet' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">CIDR Block</label>
                    <input
                      type="text"
                      value={component.properties.cidr || '10.0.1.0/24'}
                      onChange={(e) => onUpdate({ properties: { ...component.properties, cidr: e.target.value } })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="10.0.1.0/24"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Availability Zone</label>
                    <select
                      value={component.properties.availabilityZone || 'us-west-2a'}
                      onChange={(e) => onUpdate({ properties: { ...component.properties, availabilityZone: e.target.value } })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="us-west-2a">us-west-2a</option>
                      <option value="us-west-2b">us-west-2b</option>
                      <option value="us-west-2c">us-west-2c</option>
                      <option value="us-east-1a">us-east-1a</option>
                      <option value="us-east-1b">us-east-1b</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={component.properties.isPublic || false}
                      onChange={(e) => onUpdate({ properties: { ...component.properties, isPublic: e.target.checked } })}
                      className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                    />
                    <label htmlFor="isPublic" className="text-xs font-medium text-gray-600">
                      Public Subnet
                    </label>
                  </div>
                </>
              )}
              
              <button
                onClick={() => setShowSettings(false)}
                className="w-full text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1.5 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
