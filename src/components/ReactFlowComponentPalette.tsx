import React from 'react'
import { ComponentType } from '../types'
import { DraggableComponent } from './DraggableComponent'

interface ReactFlowComponentPaletteProps {
  onComponentAdd: (type: ComponentType, position: { x: number; y: number }) => void
}


const componentCategories = [
  {
    title: 'Compute',
    components: ['EC2', 'Lambda', 'Auto Scaling Group'] as ComponentType[]
  },
  {
    title: 'Storage',
    components: ['S3', 'DynamoDB', 'RDS', 'ElastiCache'] as ComponentType[]
  },
  {
    title: 'Networking',
    components: ['VPC', 'Subnet', 'Internet Gateway', 'Security Group', 'Load Balancer'] as ComponentType[]
  },
  {
    title: 'API & CDN',
    components: ['API Gateway', 'Route53', 'CloudFront'] as ComponentType[]
  },
  {
    title: 'Messaging',
    components: ['SQS', 'SNS', 'SES'] as ComponentType[]
  },
  {
    title: 'Monitoring',
    components: ['CloudWatch'] as ComponentType[]
  },
  {
    title: 'Security',
    components: ['IAM', 'KMS'] as ComponentType[]
  },
  {
    title: 'DevOps',
    components: ['CloudFormation', 'CodePipeline', 'CodeBuild', 'CodeDeploy'] as ComponentType[]
  }
]

export const ReactFlowComponentPalette: React.FC<ReactFlowComponentPaletteProps> = ({ onComponentAdd }) => {
  const handleDragStart = (type: ComponentType) => {
    // You can add visual feedback here if needed
  }

  const handleDragEnd = () => {
    // You can add cleanup here if needed
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AWS Components</h2>
        <p className="text-sm text-gray-600 mb-4">
          Drag components to add them to your architecture
        </p>
        
        {componentCategories.map((category) => (
          <div key={category.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{category.title}</h3>
            <div className="grid grid-cols-1 gap-2">
              {category.components.map((type) => (
                <DraggableComponent
                  key={type}
                  type={type}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
