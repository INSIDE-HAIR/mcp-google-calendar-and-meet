# 👨‍💻 Developer Documentation

## 🎯 Overview

This section contains technical documentation for developers who need to install, configure, deploy, and maintain the Google Meet MCP Server. Whether you're setting up a local development environment or deploying to production, you'll find the technical details you need here.

## 🚀 Quick Start Path

1. **[Installation](./installation.md)** - Set up the server locally
2. **[Environment Setup](./environment-setup.md)** - Configure credentials and environment
3. **[Local Development](./local-development.md)** - Development workflow and testing
4. **[Smithery Deployment](./smithery-deployment.md)** - Deploy to production
5. **[API Reference](./api-reference.md)** - Complete API documentation

## 📋 What You'll Find Here

### **Setup & Configuration**
- **[Installation Guide](./installation.md)** - Step-by-step installation for different environments
- **[Environment Setup](./environment-setup.md)** - Environment variables, credentials, and configuration
- **[Local Development](./local-development.md)** - Development environment, testing, and debugging

### **Deployment & Operations**
- **[Smithery Deployment](./smithery-deployment.md)** - Production deployment with Smithery
- **[Testing](./testing.md)** - Unit testing, integration testing, and quality assurance
- **[Troubleshooting](./troubleshooting.md)** - Common technical issues and solutions

### **Reference & Examples**
- **[API Reference](./api-reference.md)** - Complete technical API documentation
- **[Contributing](./contributing.md)** - Guidelines for contributing to the project
- **[Examples](./examples/)** - Code examples and configuration samples

## 🛠️ Prerequisites

Before you start, ensure you have:

- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Git** for version control
- **Google Cloud Account** with billing enabled
- **Google Workspace** (Business Standard+ for advanced features)

## 🎯 Common Developer Tasks

### **First Time Setup**
```bash
# Quick setup for developers
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server
npm install
npm run setup
```

### **Development Workflow**
```bash
# Start development server
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
```

### **Deployment Tasks**
```bash
# Deploy to Smithery
npm run deploy:smithery

# Build Docker image
npm run docker:build

# Health check
curl http://localhost:9090/health
```

## 🏗️ Architecture Overview

The MCP server is built with:

- **TypeScript** for type safety and development experience
- **Model Context Protocol** for AI integration
- **Google APIs** (Calendar v3, Meet v2) for core functionality
- **Zod validation** for input validation and type safety
- **Comprehensive monitoring** with health checks and metrics

### **Key Components**
- **Entry Points**: Standard MCP (`src/index.ts`) and Smithery (`src/smithery.ts`)
- **API Layer**: Google API integration (`src/GoogleMeetAPI.ts`)
- **Validation**: Zod schemas (`src/validation/meetSchemas.ts`)
- **Monitoring**: Health checks, metrics, and API monitoring
- **Error Handling**: Specialized error handling for Google APIs

## 🔗 Related Resources

- **[Context Engineer Docs](../context-engineer/)** - Business logic and Claude project setup
- **[User Documentation](../user/)** - End-user guides and tutorials
- **[Shared Resources](../shared/)** - Permissions, templates, and common references

## 🆘 Developer Support

### **Getting Help**
- **Technical Issues**: [GitHub Issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)
- **Development Questions**: [GitHub Discussions](https://github.com/INSIDE-HAIR/google-meet-mcp-server/discussions)
- **API Questions**: See [API Reference](./api-reference.md) and [Troubleshooting](./troubleshooting.md)

### **Contributing**
- **Bug Reports**: Use our issue templates
- **Feature Requests**: Start with GitHub Discussions
- **Pull Requests**: See [Contributing Guide](./contributing.md)
- **Documentation**: Help improve these docs!

---

**🎯 Ready to dive in? Start with the [Installation Guide](./installation.md) for your first setup.**