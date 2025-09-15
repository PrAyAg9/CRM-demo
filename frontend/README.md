# Mini CRM Frontend

A React-based frontend application for the Mini CRM Platform with AI-powered features.

## Features

- **Google OAuth Authentication**: Secure authentication using Google OAuth 2.0
- **Responsive Design**: Built with Tailwind CSS for modern, responsive UI
- **Customer Management**: Comprehensive customer database and management
- **Campaign Management**: Create and manage marketing campaigns
- **AI-Powered Segmentation**: Intelligent customer segmentation with natural language processing
- **Analytics Dashboard**: Real-time insights and campaign performance metrics
- **TypeScript Support**: Full TypeScript support for better development experience

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **React Query** for state management and API calls
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **React Hook Form** for form management
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Backend server running on port 3000

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Available Scripts

- `npm start` - Starts the development server on port 3001
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (irreversible)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Customers.tsx   # Customer management
│   ├── Campaigns.tsx   # Campaign management
│   ├── Segments.tsx    # Customer segmentation
│   ├── Analytics.tsx   # Analytics dashboard
│   ├── Settings.tsx    # Application settings
│   ├── Login.tsx       # Login page
│   └── NotFound.tsx    # 404 page
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx            # Main app component
├── index.tsx          # Application entry point
└── index.css          # Global styles
```

## Environment Configuration

The frontend connects to the backend server automatically through the proxy configuration in `package.json`.

For production, update the API endpoints to point to your production backend URL.

## Authentication Flow

1. User clicks "Continue with Google" on login page
2. Redirected to Google OAuth consent screen
3. After authorization, redirected back to app with auth token
4. Token stored in localStorage for subsequent API calls
5. Protected routes require valid authentication

## Key Features Implementation

### Authentication

- Google OAuth 2.0 integration
- JWT token management
- Protected route guards
- Automatic token refresh

### Customer Management

- Customer list with search and filtering
- Individual customer profiles
- Import/export functionality
- AI-powered customer insights

### Campaign Management

- Campaign creation wizard
- Template library
- Audience targeting
- Performance tracking
- A/B testing capabilities

### Segmentation

- Visual rule builder
- Natural language processing
- Real-time preview
- Segment analytics

### Analytics

- Campaign performance metrics
- Customer behavior insights
- Revenue tracking
- Interactive charts and graphs

## Development Guidelines

### Code Style

- Use TypeScript for all new components
- Follow React hooks best practices
- Use functional components over class components
- Implement proper error boundaries

### State Management

- Use React Query for server state
- Use React Context for global client state
- Keep component state local when possible

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Use semantic color classes

## API Integration

The frontend communicates with the backend through RESTful APIs:

- `/api/auth/*` - Authentication endpoints
- `/api/customers/*` - Customer management
- `/api/campaigns/*` - Campaign operations
- `/api/segments/*` - Segmentation features
- `/api/ai/*` - AI-powered features

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Bundle size monitoring
- Memoization of expensive calculations
- Efficient re-rendering patterns

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Deployment

### Development

```bash
npm start
```

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
# Build Docker image
docker build -t mini-crm-frontend .

# Run container
docker run -p 3001:3001 mini-crm-frontend
```

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commit messages

## License

This project is licensed under the MIT License.
