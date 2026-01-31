# AWS Architecture Builder

A drag-and-drop visual tool for building AWS architectures that automatically generates production-ready Terraform code.

## Features

- **Visual Architecture Design**: Click to add AWS components and connect them on an interactive canvas
- **Smart Terraform Generation**: Generates proper Terraform HCL with:
  - Variable definitions for sensitive values (passwords, etc.)
  - Proper resource references and interpolation
  - IAM roles and policies based on component connections
  - Resource outputs for commonly needed values
- **Intelligent IAM Policies**: Automatically generates correct IAM policies based on:
  - Resource-based policies (e.g., Lambda permissions for S3 triggers)
  - Execution role policies (e.g., Lambda accessing DynamoDB)
  - Consolidated policies for multiple targets
- **Comprehensive AWS Services**: 25+ AWS services across compute, storage, networking, and more

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd aws-architecture-builder

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Building an Architecture

1. **Add Components**: Click AWS components from the left palette to add them to the canvas
2. **Connect Services**: Drag from one component's handle to another to create connections
3. **Configure Properties**: Click components to open settings and customize names
4. **Generate Code**: Click "Generate" in the right panel to create Terraform code
5. **Export**: Copy or download the generated Terraform code

### Connection Types

- **Trigger**: Service A triggers Service B (e.g., S3 → Lambda)
- **Permission**: Service A accesses Service B (e.g., Lambda → DynamoDB)
- **Data Flow**: General data connection between services

## Supported AWS Services

| Category | Services |
|----------|----------|
| **Compute** | EC2, Lambda, Auto Scaling Group |
| **Storage** | S3, DynamoDB, RDS, ElastiCache |
| **Networking** | VPC, Subnet, Internet Gateway, Load Balancer, Security Group |
| **API & CDN** | API Gateway, Route53, CloudFront |
| **Messaging** | SQS, SNS, SES |
| **Monitoring** | CloudWatch |
| **Security** | IAM, KMS |
| **DevOps** | CloudFormation, CodePipeline, CodeBuild, CodeDeploy |

## Project Structure

```
src/
├── components/
│   ├── SimpleComponentPalette.tsx  # Left sidebar with AWS components
│   ├── SimpleReactFlowCanvas.tsx   # Main canvas using React Flow
│   ├── ReactFlowAWSNode.tsx        # Individual component nodes
│   ├── ReactFlowCustomEdge.tsx     # Custom connection edges
│   └── TerraformCodePanel.tsx      # Right sidebar with generated code
├── iamPolicyGenerator.ts           # IAM policy generation logic
├── iamPolicyMapping.ts             # Service capabilities and policy requirements
├── types.ts                        # TypeScript type definitions
├── App.tsx                         # Main application component
└── main.tsx                        # Application entry point
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Flow** - Interactive canvas and connections
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## Generated Terraform Features

The generated Terraform code includes:

- **Variables**: Configurable values for AMI IDs, instance types, database credentials, etc.
- **Proper Resource References**: Uses Terraform references instead of hardcoded values
- **IAM Resources**: 
  - Execution roles with assume role policies
  - Resource-based permissions (e.g., Lambda permissions)
  - Consolidated policies for multiple resource access
- **Outputs**: Useful outputs like Lambda ARNs, S3 bucket names, API URLs
- **Best Practices**: Skip final snapshot flags, proper tagging, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for issues
5. Submit a pull request

## License

MIT License
