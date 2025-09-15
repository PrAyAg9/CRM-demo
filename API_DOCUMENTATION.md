# Mini CRM Platform API Documentation

## Overview

The Mini CRM Platform provides a comprehensive RESTful API for customer relationship management with AI-powered features. This API enables you to manage customers, orders, campaigns, segments, and leverage artificial intelligence for insights and automation.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses Google OAuth 2.0 for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Login with Google OAuth

```http
GET /auth/google
```

#### OAuth Callback

```http
GET /auth/google/callback
```

#### Logout

```http
POST /auth/logout
```

#### Check Authentication Status

```http
GET /auth/me
```

## Customer Management

### Get All Customers

```http
GET /customers
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search in name and email
- `totalSpent[gte]` (number): Minimum total spent
- `totalSpent[lte]` (number): Maximum total spent
- `orderCount[gte]` (number): Minimum order count
- `createdAt[gte]` (date): Created after date
- `createdAt[lte]` (date): Created before date

**Response:**

```json
{
  "customers": [
    {
      "_id": "customer_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "totalSpent": 1250.0,
      "orderCount": 8,
      "lastOrderDate": "2024-01-15T10:30:00Z",
      "location": {
        "city": "New York",
        "state": "NY",
        "country": "USA"
      },
      "createdAt": "2023-12-01T10:00:00Z"
    }
  ],
  "total": 100,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Create Customer

```http
POST /customers
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "preferences": {
    "channel": "email",
    "frequency": "weekly"
  }
}
```

### Get Customer by ID

```http
GET /customers/{id}
```

### Update Customer

```http
PUT /customers/{id}
```

### Delete Customer

```http
DELETE /customers/{id}
```

### Import Customers (CSV)

```http
POST /customers/import
```

**Content-Type:** `multipart/form-data`
**Body:** CSV file with customer data

## Order Management

### Get All Orders

```http
GET /orders
```

**Query Parameters:**

- `customerId` (string): Filter by customer ID
- `status` (string): Filter by order status
- `total[gte]` (number): Minimum order total
- `orderDate[gte]` (date): Orders after date

### Create Order

```http
POST /orders
```

**Request Body:**

```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "name": "Product Name",
      "price": 29.99,
      "quantity": 2,
      "category": "electronics"
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

### Update Order Status

```http
PATCH /orders/{id}/status
```

**Request Body:**

```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890"
}
```

## Campaign Management

### Get All Campaigns

```http
GET /campaigns
```

**Query Parameters:**

- `status` (string): Filter by campaign status
- `type` (string): Filter by campaign type (email, sms, push)
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order (asc, desc)

### Create Campaign

```http
POST /campaigns
```

**Request Body:**

```json
{
  "name": "Welcome Email Campaign",
  "type": "email",
  "subject": "Welcome to Our Store!",
  "content": "Hi {{firstName}}, welcome to our store!",
  "audienceType": "segment",
  "segmentRules": {
    "id": "root",
    "logic": "AND",
    "rules": [
      {
        "id": "rule1",
        "field": "totalSpent",
        "operator": "greater_than",
        "value": 100,
        "type": "number"
      }
    ]
  },
  "schedulingType": "immediate"
}
```

### Update Campaign Status

```http
PATCH /campaigns/{id}/status
```

**Request Body:**

```json
{
  "status": "scheduled"
}
```

### Send Campaign

```http
POST /campaigns/{id}/send
```

### Get Campaign Analytics

```http
GET /campaigns/{id}/analytics
```

## Segment Management

### Get All Segments

```http
GET /segments
```

### Create Segment

```http
POST /segments
```

**Request Body:**

```json
{
  "name": "High-Value Customers",
  "description": "Customers who have spent more than $500",
  "rules": {
    "id": "root",
    "logic": "AND",
    "rules": [
      {
        "id": "rule1",
        "field": "totalSpent",
        "operator": "greater_than",
        "value": 500,
        "type": "number"
      }
    ]
  }
}
```

### Preview Segment

```http
POST /segments/preview
```

**Request Body:**

```json
{
  "rules": {
    "id": "root",
    "logic": "AND",
    "rules": [...]
  }
}
```

**Response:**

```json
{
  "count": 25,
  "sampleCustomers": [
    {
      "id": "customer_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

## AI Features

### Natural Language Segment Suggestions

```http
POST /ai/segment-suggestions
```

**Request Body:**

```json
{
  "query": "customers who spent more than $500 in the last 3 months"
}
```

**Response:**

```json
{
  "suggestions": [
    {
      "id": "suggestion_id",
      "name": "High-Value Recent Customers",
      "description": "Customers with significant recent spending",
      "rules": {...},
      "confidence": 0.95,
      "potentialAudience": 127,
      "insights": [
        "This segment represents 12% of your customer base",
        "Average order value is 40% higher than overall average"
      ]
    }
  ]
}
```

### AI Message Suggestions

```http
POST /ai/message-suggestions
```

**Request Body:**

```json
{
  "type": "email",
  "goal": "Promote summer sale",
  "audience": "High-value customers",
  "tone": "friendly"
}
```

### AI Insights

```http
GET /ai/insights
```

**Response:**

```json
{
  "insights": [
    {
      "id": "insight_id",
      "type": "customer_behavior",
      "title": "Declining Engagement in Electronics Category",
      "description": "Customer engagement in electronics has decreased by 15% over the last month",
      "impact": "high",
      "recommendation": "Consider targeted promotions for electronics products"
    }
  ]
}
```

## Analytics

### Customer Analytics

```http
GET /analytics/customers
```

**Query Parameters:**

- `period` (string): Time period (day, week, month, year)
- `startDate` (date): Start date for analysis
- `endDate` (date): End date for analysis

### Revenue Analytics

```http
GET /analytics/revenue
```

### Campaign Performance

```http
GET /analytics/campaigns
```

### Segment Performance

```http
GET /analytics/segments
```

## Error Handling

The API uses standard HTTP status codes and returns error information in the following format:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per minute per IP
- **AI endpoints**: 20 requests per minute per user
- **Import endpoints**: 5 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

## Data Export

### Export Customers

```http
GET /customers/export?format=csv
```

### Export Orders

```http
GET /orders/export?format=csv
```

### Export Campaign Results

```http
GET /campaigns/{id}/export?format=csv
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Available Events

- `customer.created`
- `customer.updated`
- `order.created`
- `order.status_updated`
- `campaign.sent`
- `campaign.completed`

### Configure Webhook

```http
POST /webhooks
```

**Request Body:**

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["customer.created", "order.created"],
  "secret": "your_webhook_secret"
}
```

## SDKs and Libraries

Official SDKs are available for:

- JavaScript/Node.js
- Python
- PHP
- Ruby

Example JavaScript usage:

```javascript
import { CRMClient } from "@mini-crm/sdk";

const crm = new CRMClient({
  apiKey: "your_api_key",
  baseUrl: "http://localhost:3000/api",
});

const customers = await crm.customers.list({
  limit: 10,
  totalSpent: { gte: 100 },
});
```

## Support

For API support and questions:

- Email: api-support@mini-crm.com
- Documentation: https://docs.mini-crm.com
- Status Page: https://status.mini-crm.com
