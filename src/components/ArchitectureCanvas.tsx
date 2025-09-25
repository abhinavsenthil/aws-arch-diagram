import React, { useState, useRef, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AWSComponent, Connection } from '../types'
import { AWSComponentNode } from './AWSComponentNode'
import { ConnectionLine } from './ConnectionLine'

interface ArchitectureCanvasProps {
  components: AWSComponent[]
  connections: Connection[]
  onComponentSelect: (componentId: string) => void
  onComponentUpdate: (componentId: string, updates: Partial<AWSComponent>) => void
  onComponentDelete: (componentId: string) => void
  onConnectionCreate: (from: string, to: string) => void
  onConnectionDelete: (from: string, to: string) => void
  selectedComponent: string | null
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  components,
  connections,
  onComponentSelect,
  onComponentUpdate,
  onComponentDelete,
  onConnectionCreate,
  onConnectionDelete,
  selectedComponent
}) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas',
  })

  const handleComponentDrag = useCallback((componentId: string, newPosition: { x: number; y: number }) => {
    onComponentUpdate(componentId, { position: newPosition })
  }, [onComponentUpdate])

  const handleComponentClick = useCallback((componentId: string) => {
    onComponentSelect(componentId)
  }, [onComponentSelect])

  const handleConnectionStart = useCallback((componentId: string) => {
    if (isConnecting) {
      if (connectionStart && connectionStart !== componentId) {
        onConnectionCreate(connectionStart, componentId)
        setIsConnecting(false)
        setConnectionStart(null)
      }
    } else {
      setIsConnecting(true)
      setConnectionStart(componentId)
    }
  }, [isConnecting, connectionStart, onConnectionCreate])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onComponentSelect('')
      if (isConnecting) {
        setIsConnecting(false)
        setConnectionStart(null)
      }
    }
  }, [onComponentSelect, isConnecting])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedComponent) {
      onComponentDelete(selectedComponent)
    }
    if (e.key === 'Escape') {
      setIsConnecting(false)
      setConnectionStart(null)
    }
  }, [selectedComponent, onComponentDelete])

  return (
    <div
      id="canvas"
      ref={setNodeRef}
      className={`flex-1 relative bg-gray-50 border-2 border-dashed ${
        isOver ? 'border-aws-blue bg-blue-50' : 'border-gray-300'
      } transition-colors duration-200 min-h-[400px] overflow-visible`}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="absolute inset-0 overflow-visible">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection lines */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ zIndex: 1, overflow: 'visible' }}
          viewBox="0 0 100% 100%"
          preserveAspectRatio="none"
        >
          {connections.map((connection, index) => {
            const fromComponent = components.find(c => c.id === connection.from)
            const toComponent = components.find(c => c.id === connection.to)
            
            if (!fromComponent || !toComponent) return null

            return (
              <ConnectionLine
                key={index}
                from={fromComponent.position}
                to={toComponent.position}
                connectionType={connection.type}
                direction={connection.direction}
                fromPort={connection.fromPort}
                toPort={connection.toPort}
                onDelete={() => onConnectionDelete(connection.from, connection.to)}
              />
            )
          })}
        </svg>

        {/* Components */}
        {components.map((component) => (
          <AWSComponentNode
            key={component.id}
            component={component}
            isSelected={selectedComponent === component.id}
            isConnecting={isConnecting}
            connectionStart={connectionStart}
            onDrag={handleComponentDrag}
            onClick={handleComponentClick}
            onConnectionStart={handleConnectionStart}
            onDelete={onComponentDelete}
            onComponentUpdate={onComponentUpdate}
          />
        ))}

        {/* Connection mode indicator */}
        {isConnecting && (
          <div className="absolute top-4 left-4 bg-aws-blue text-white px-3 py-2 rounded-lg shadow-lg max-w-xs">
            <p className="text-sm font-medium">🔗 Connection Mode Active</p>
            <p className="text-xs opacity-75">Drag from port circles to connect</p>
            <p className="text-xs opacity-75">Press ESC to cancel</p>
            <div className="mt-2 text-xs">
              <p>🟢 Left port: "Invoked by"</p>
              <p>🟠 Right port: "Calls"</p>
              <p>⚡ Right → Left: Trigger</p>
              <p>🛡️ Right → Right: Permission</p>
            </div>
          </div>
        )}

        {/* Instructions when canvas is empty */}
        {components.length === 0 && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-lg font-medium mb-2">Start Building Your AWS Architecture</h3>
              <p className="text-sm">Drag components from the left sidebar to this canvas</p>
            </div>
          </div>
        )}

        {/* Connection instructions */}
        {components.length > 1 && !isConnecting && (
          <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
            <h4 className="text-sm font-medium text-gray-800 mb-2">💡 How to Connect:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Drag from 🟠 right port (calls)</li>
              <li>• To 🟢 left port (invoked by)</li>
              <li>• Creates triggers and data flow</li>
              <li>• Right → Right: permissions</li>
              <li>• Generate Terraform code on the right</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
