# API Screen Mapper

A tool for mapping and managing API points on screen images.

English | [한국어](README.ko.md)

## Key Features

- Project-based screen management
- API point mapping on screen images
- Query and Mutation distinction
- API code and description management
- Export screens and API lists (image, markdown)
- Drag and drop API point positioning
- API list reordering

## Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/JongSeok-327/APIScreenMapper.git
cd graphql-screen-mapper

# Install dependencies
npm install
# or
yarn install

# Run development server
npm start
# or
yarn start
```

### Build

```bash
npm run build
# or
yarn build
```

## How to Use

1. Create a project
2. Upload screen images
3. Click on the screen to add API points
4. Enter API information (name, type, code, description)
5. Drag API points to adjust positions
6. Export for documentation

## Tech Stack

- React
- TypeScript
- Material-UI
- Dexie (IndexedDB)
- Monaco Editor
