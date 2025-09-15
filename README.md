# Mini CRM Platform

A comprehensive Customer Relationship Management platform with AI-powered segmentation, personalized campaign delivery, and intelligent insights.

## 🚀 Features

### Core Functionality

- **Data Ingestion APIs**: Secure REST APIs for customer and order data
- **Campaign Creation UI**: Intuitive web interface with dynamic rule builder
- **Campaign Delivery & Logging**: Automated delivery with vendor simulation
- **Google OAuth Authentication**: Secure user authentication
- **AI Integration**: Multiple AI-powered features for enhanced CRM capabilities

### AI-Powered Features

- **Natural Language to Segment Rules**: Convert plain English to logical rules
- **AI-Driven Message Suggestions**: Generate personalized campaign messages
- **Campaign Performance Summarization**: Intelligent insights and analytics
- **Smart Scheduling Suggestions**: Optimal campaign timing recommendations

### Technical Highlights

- **Pub-Sub Architecture**: Redis Streams for async data processing
- **Real-time Preview**: Live audience size calculation
- **Batch Processing**: Efficient delivery receipt handling
- **Comprehensive API Documentation**: Swagger/OpenAPI integration

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache/Message Broker**: Redis Streams
- **Authentication**: Google OAuth 2.0 + JWT
- **AI Integration**: OpenAI API
- **Documentation**: Swagger UI

### Frontend

- **Framework**: React.js with hooks
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **State Management**: React Query for server state
- **Drag & Drop**: React Beautiful DnD

## 📁 Project Structure

```
mini-crm/
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # React components
│       ├── contexts/    # React contexts
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── utils/       # Utility functions
│       └── App.js       # Main App component
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Redis server
- Google OAuth credentials
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mini-crm
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mini-crm

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret

# AI
OPENAI_API_KEY=your-openai-api-key

# URLs
FRONTEND_URL=http://localhost:3001
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:3000/api-docs` for interactive API documentation.

### Key Endpoints

- `POST /api/customers` - Create customer
- `POST /api/orders` - Create order
- `GET /api/segmentation/preview` - Preview audience size
- `POST /api/campaigns` - Create and launch campaign
- `GET /api/campaigns` - Get campaign history
- `POST /api/ai/segment-rules` - Convert natural language to rules
- `POST /api/ai/message-suggestions` - Get AI message suggestions

## 🎯 Usage Guide

### 1. Authentication

- Visit the application and click "Login with Google"
- Authorize the application to access your Google account

### 2. Data Ingestion

- Use the API endpoints to add customers and orders
- Data is processed asynchronously via Redis Streams

### 3. Creating Campaigns

- Navigate to "Create Campaign"
- Use the visual rule builder or natural language input
- Preview audience size before saving
- Choose from AI-generated message suggestions

### 4. Campaign Management

- View campaign history with delivery statistics
- Monitor real-time delivery status
- Analyze campaign performance with AI insights

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Update all URLs to production domains
- Use secure database connections
- Configure proper CORS settings

## 🤖 AI Features Detail

### Natural Language Processing

- Converts queries like "customers who spent over ₹5000 and haven't purchased in 6 months"
- Supports complex AND/OR logic
- Handles various spending patterns and time-based conditions

### Message Generation

- Context-aware message suggestions
- Personalized content based on customer data
- Multiple variants for A/B testing

### Performance Analytics

- Automated campaign summaries
- Delivery rate analysis
- Customer segment insights

## 🔧 Architecture Decisions

### Pub-Sub Pattern

- APIs handle validation only
- Redis Streams manage async processing
- Improved scalability and reliability

### AI Integration Strategy

- OpenAI for natural language processing
- Local caching for improved performance
- Fallback mechanisms for API failures

### Security Measures

- JWT tokens for API authentication
- Google OAuth for user verification
- Rate limiting and request validation
- CORS configuration for frontend security

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategy**: Redis for frequently accessed data
- **Batch Processing**: Efficient handling of bulk operations
- **Async Operations**: Non-blocking campaign delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Google for OAuth services
- MongoDB for database solutions
- Redis for message brokering
- React community for frontend tools
