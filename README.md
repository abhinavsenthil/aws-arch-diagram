# AWS Architecture Builder

A drag-and-drop visual tool for building AWS architectures that automatically generates Terraform code.
Vibe coded full disclosure

## Features

- 🎨 **Visual Architecture Design**: Drag and drop AWS components to build your infrastructure
- 🔧 **Auto Terraform Generation**: Automatically generates Terraform HCL code from your architecture
- 🔗 **Component Connections**: Connect AWS services to define relationships
- 📦 **Comprehensive AWS Services**: Support for EC2, S3, RDS, Lambda, VPC, and many more
- 💾 **Export & Deploy**: Download Terraform code and deploy to AWS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Building an Architecture

1. **Drag Components**: Drag AWS components from the left palette to the canvas
2. **Connect Services**: Click on components to start connections, then click target components
3. **Configure Properties**: Select components to configure their properties
4. **Generate Code**: Click "Generate" in the right panel to create Terraform code
5. **Export**: Copy or download the generated Terraform code

### Supported AWS Services

#### Compute
- EC2 Instances
- Lambda Functions
- Auto Scaling Groups

#### Storage
- S3 Buckets
- RDS Databases
- DynamoDB Tables
- ElastiCache

#### Networking
- VPC
- Subnets
- Internet Gateway
- Load Balancers
- Route53
- CloudFront

#### Security
- Security Groups
- IAM Roles
- KMS Keys

#### Application Services
- API Gateway
- SQS Queues
- SNS Topics
- SES Email

#### Monitoring & DevOps
- CloudWatch
- CodePipeline
- CodeBuild
- CodeDeploy

## Project Structure

```
src/
├── components/
│   ├── AWSComponentPalette.tsx    # Left sidebar with draggable components
│   ├── ArchitectureCanvas.tsx     # Main canvas for architecture design
│   ├── AWSComponentNode.tsx       # Individual component nodes
│   ├── ConnectionLine.tsx         # SVG connection lines
│   └── TerraformCodePanel.tsx     # Right sidebar with generated code
├── types.ts                       # TypeScript type definitions
├── App.tsx                        # Main application component
└── main.tsx                       # Application entry point
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **@dnd-kit** - Drag and drop functionality
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Real-time collaboration
- [ ] AWS deployment integration
- [ ] Cost estimation
- [ ] Architecture validation
- [ ] Template library
- [ ] Multi-cloud support
