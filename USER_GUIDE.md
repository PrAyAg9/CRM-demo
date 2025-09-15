# Mini CRM Platform User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Customer Management](#customer-management)
4. [Campaign Management](#campaign-management)
5. [Customer Segmentation](#customer-segmentation)
6. [AI-Powered Features](#ai-powered-features)
7. [Analytics & Reporting](#analytics--reporting)
8. [Settings & Configuration](#settings--configuration)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Google account for authentication

### First Time Setup

1. **Access the Platform**

   - Navigate to the Mini CRM Platform URL
   - Click "Sign in with Google"
   - Authorize the application with your Google account

2. **Initial Dashboard**

   - After login, you'll see the main dashboard
   - Take a moment to familiarize yourself with the navigation menu
   - Check if demo data has been loaded (recommended for first-time users)

3. **Load Demo Data (Optional)**
   - Go to Settings > Demo Data
   - Click "Generate Demo Data" to populate the platform with sample customers, orders, and campaigns
   - This helps you explore features without entering real data

## Dashboard Overview

The dashboard provides a high-level view of your CRM performance:

### Key Metrics Cards

- **Total Customers**: Current customer count with growth indicator
- **Active Campaigns**: Number of running campaigns
- **Monthly Revenue**: Current month's revenue with comparison to previous month
- **Conversion Rate**: Overall conversion rate percentage

### Charts and Visualizations

- **Revenue Trend**: Monthly revenue over the past 12 months
- **Customer Growth**: New customer acquisition over time
- **Campaign Performance**: Open rates and click rates for recent campaigns
- **Top Segments**: Your most valuable customer segments

### Quick Actions

- Create new campaign
- Add customer
- View latest orders
- Access AI insights

## Customer Management

### Viewing Customers

1. **Customer List**

   - Navigate to "Customers" in the sidebar
   - View all customers in a paginated table
   - Use search and filters to find specific customers

2. **Customer Filters**

   - **Search**: Find customers by name or email
   - **Total Spent**: Filter by spending range
   - **Order Count**: Filter by number of orders
   - **Registration Date**: Filter by when they joined
   - **Location**: Filter by city, state, or country

3. **Customer Details**
   - Click on any customer to view detailed information
   - See order history, total spent, and engagement metrics
   - View customer's segment memberships and preferences

### Adding New Customers

1. **Manual Entry**

   - Click "Add Customer" button
   - Fill in required fields: First Name, Last Name, Email
   - Add optional information: Phone, Address, Preferences
   - Click "Save Customer"

2. **Bulk Import**
   - Go to Customers > Import
   - Download the CSV template
   - Fill in customer data following the template format
   - Upload the completed CSV file
   - Review and confirm the import

### Editing Customer Information

1. **Individual Updates**

   - Open customer details
   - Click "Edit Customer"
   - Modify any field except email (which serves as unique identifier)
   - Save changes

2. **Bulk Updates**
   - Select multiple customers using checkboxes
   - Choose "Bulk Actions" > "Update"
   - Apply changes to selected customers

### Customer Segmentation Labels

- **VIP**: High-value customers (customizable criteria)
- **New**: Recently registered customers
- **At-Risk**: Customers with declining engagement
- **Loyal**: Customers with consistent purchase patterns

## Campaign Management

### Campaign Types

The platform supports three types of campaigns:

1. **Email Campaigns**

   - Rich HTML content with personalization
   - Subject line optimization
   - A/B testing capabilities

2. **SMS Campaigns**

   - Short, direct messages
   - Character count tracking
   - Higher engagement rates

3. **Push Notifications**
   - Instant delivery
   - Rich media support
   - Perfect for time-sensitive offers

### Creating a Campaign

#### Step 1: Choose Template

1. Navigate to Campaigns > Create Campaign
2. Browse available templates by category:

   - **Welcome**: For new customers
   - **Promotional**: Sales and discounts
   - **Retention**: Re-engagement campaigns
   - **Transactional**: Order confirmations, shipping updates

3. Select a template or start from scratch

#### Step 2: Configure Content

1. **Campaign Name**: Internal name for organization
2. **Campaign Type**: Email, SMS, or Push
3. **Subject Line** (Email only): Compelling subject that encourages opens
4. **Message Content**: Your campaign message with personalization variables

**Personalization Variables:**

- `{{firstName}}` - Customer's first name
- `{{lastName}}` - Customer's last name
- `{{company_name}}` - Your company name
- `{{shop_url}}` - Link to your store
- `{{unsubscribe_url}}` - Unsubscribe link

#### Step 3: Select Audience

1. **All Customers**: Send to entire customer base
2. **Customer Segment**: Target specific segment (recommended)
3. **Upload List**: Use custom CSV file

#### Step 4: Schedule Delivery

1. **Send Immediately**: Campaign goes out right away
2. **Schedule for Later**: Choose specific date and time
3. **Recurring Campaign**: Set up automated sending (premium feature)

#### Step 5: Review and Launch

1. Review all campaign details
2. Preview how the message will appear
3. Check audience size and estimated reach
4. Click "Create Campaign" to launch

### Managing Active Campaigns

1. **Campaign Dashboard**

   - View all campaigns with status indicators
   - Filter by status: Draft, Scheduled, Sending, Sent, Failed
   - Sort by creation date, name, or performance metrics

2. **Campaign Actions**

   - **Edit**: Modify draft campaigns
   - **Pause**: Stop sending campaigns in progress
   - **Resume**: Restart paused campaigns
   - **Duplicate**: Create copy of existing campaign
   - **Delete**: Remove draft or failed campaigns

3. **Performance Tracking**
   - **Sent**: Number of messages delivered
   - **Open Rate**: Percentage of recipients who opened
   - **Click Rate**: Percentage who clicked links
   - **Conversion Rate**: Percentage who completed desired action

## Customer Segmentation

### Understanding Segments

Customer segments are groups of customers who share specific characteristics. Effective segmentation enables:

- Targeted marketing campaigns
- Personalized customer experiences
- Improved conversion rates
- Better customer retention

### Segment Builder Tools

#### Manual Segment Builder

1. **Navigate**: Segments > Manual Builder
2. **Set Conditions**: Create rules based on customer attributes
3. **Available Fields**:

   - **Demographics**: Name, email, location
   - **Behavior**: Total spent, order count, last order date
   - **Engagement**: Email opens, clicks, website visits
   - **Preferences**: Communication channel, frequency

4. **Operators**:

   - **Text**: equals, contains, starts with, ends with
   - **Numbers**: greater than, less than, between
   - **Dates**: before, after, between, last N days

5. **Logic Operators**:
   - **AND**: All conditions must be true
   - **OR**: Any condition can be true
   - **Nested Groups**: Complex logic combinations

#### AI Segment Builder

1. **Navigate**: Segments > AI Segment Builder
2. **Natural Language Input**: Describe your target audience in plain English
   - Example: "Customers who spent more than $500 in the last 3 months"
   - Example: "VIP customers from New York who prefer email"
3. **AI Suggestions**: Review AI-generated segment rules
4. **Confidence Score**: AI confidence in segment accuracy
5. **Preview**: See sample customers and estimated audience size

### Pre-built Segment Examples

1. **High-Value Customers**

   - Total spent > $500
   - Order count > 3
   - Active in last 90 days

2. **New Customer Onboarding**

   - Registered in last 30 days
   - Order count < 2
   - Email preferences enabled

3. **Win-Back Campaign**

   - Last order > 60 days ago
   - Total spent > $100
   - Previously active customers

4. **VIP Loyalty Program**
   - Total spent > $1000
   - Order count > 10
   - Customer for > 1 year

### Segment Management

1. **Active Segments**: View all created segments with member counts
2. **Segment Performance**: Track how segments perform in campaigns
3. **Segment Overlap**: Identify customers in multiple segments
4. **Automated Updates**: Segments automatically update as customer data changes

## AI-Powered Features

### Natural Language Segment Builder

The AI Segment Builder allows you to create customer segments using natural language:

1. **How It Works**

   - Type your audience description in plain English
   - AI analyzes your request and generates segment rules
   - Multiple suggestions provided with confidence scores
   - Preview shows sample customers and audience size

2. **Example Queries**

   - "Find customers who spent more than $200 last month"
   - "Show me VIP customers from California"
   - "Customers who haven't ordered in 2 months but have high lifetime value"
   - "New customers who joined this quarter"

3. **Voice Input** (if supported by browser)
   - Click the microphone icon
   - Speak your segment description
   - AI processes speech and creates segments

### AI Message Assistant

Get intelligent content suggestions for your campaigns:

1. **Campaign Goals**

   - Welcome new customers
   - Promote sales and discounts
   - Re-engage inactive customers
   - Cross-sell products
   - Collect feedback

2. **Tone Options**

   - Professional: Formal, business-appropriate
   - Friendly: Warm, conversational
   - Urgent: Time-sensitive, action-oriented
   - Promotional: Sales-focused, enthusiastic

3. **AI Suggestions Include**
   - Optimized subject lines
   - Personalized message content
   - Call-to-action recommendations
   - A/B testing variations

### AI Insights Dashboard

Discover hidden patterns and opportunities:

1. **Customer Behavior Insights**

   - Purchasing pattern analysis
   - Seasonal trend identification
   - Customer lifecycle stages
   - Churn risk predictions

2. **Campaign Optimization**

   - Best sending times
   - Subject line performance
   - Content recommendations
   - Audience targeting suggestions

3. **Revenue Opportunities**

   - Cross-sell possibilities
   - Upsell recommendations
   - Price optimization insights
   - Market expansion opportunities

4. **Actionable Recommendations**
   - Each insight includes specific actions
   - Implementation difficulty rating
   - Expected impact assessment
   - Success metrics to track

## Analytics & Reporting

### Dashboard Analytics

1. **Key Performance Indicators (KPIs)**

   - Customer Acquisition Cost (CAC)
   - Customer Lifetime Value (CLV)
   - Monthly Recurring Revenue (MRR)
   - Churn Rate
   - Average Order Value (AOV)

2. **Trend Analysis**
   - Revenue growth over time
   - Customer acquisition trends
   - Campaign performance evolution
   - Seasonal patterns

### Customer Analytics

1. **Customer Insights**

   - Demographics breakdown
   - Geographic distribution
   - Purchase behavior patterns
   - Engagement metrics

2. **Cohort Analysis**

   - Customer retention by signup month
   - Revenue per cohort
   - Behavior changes over time

3. **Customer Segmentation Performance**
   - Segment size and growth
   - Revenue contribution by segment
   - Engagement rates per segment

### Campaign Analytics

1. **Email Campaign Metrics**

   - Delivery rate
   - Open rate
   - Click-through rate
   - Conversion rate
   - Revenue attribution

2. **SMS Campaign Metrics**

   - Delivery rate
   - Click-through rate
   - Response rate
   - Opt-out rate

3. **Cross-Channel Performance**
   - Channel comparison
   - Multi-touch attribution
   - Customer journey analysis

### Custom Reports

1. **Report Builder**

   - Drag-and-drop interface
   - Custom date ranges
   - Multiple visualization types
   - Export capabilities

2. **Scheduled Reports**
   - Automated report generation
   - Email delivery
   - PDF and CSV formats
   - Custom recipients

## Settings & Configuration

### Account Settings

1. **Profile Information**

   - Update personal details
   - Change notification preferences
   - Manage API access

2. **Company Information**
   - Business details
   - Branding customization
   - Contact information

### Integration Settings

1. **Email Service Provider**

   - Configure SMTP settings
   - Connect third-party services
   - Authentication setup

2. **SMS Gateway**

   - Provider configuration
   - API credentials
   - Testing tools

3. **Analytics Integration**
   - Google Analytics connection
   - Facebook Pixel setup
   - Custom tracking codes

### Data Management

1. **Import/Export**

   - Bulk data operations
   - Scheduled backups
   - Data format preferences

2. **Data Retention**

   - Retention policies
   - Automatic cleanup
   - Compliance settings

3. **Privacy & Compliance**
   - GDPR compliance tools
   - Data deletion requests
   - Consent management

## Troubleshooting

### Common Issues

1. **Login Problems**

   - Clear browser cache and cookies
   - Try incognito/private browsing mode
   - Check Google account permissions
   - Contact support if issues persist

2. **Campaign Delivery Issues**

   - Verify email/SMS provider settings
   - Check recipient email validity
   - Review spam filter settings
   - Ensure adequate sending limits

3. **Data Import Errors**

   - Validate CSV format matches template
   - Check for duplicate emails
   - Verify required fields are filled
   - Remove special characters if needed

4. **Performance Issues**
   - Check internet connection
   - Clear browser cache
   - Close unnecessary browser tabs
   - Try different browser

### Getting Help

1. **In-App Help**

   - Tooltips and help text throughout the interface
   - Contextual help for complex features
   - Video tutorials for key workflows

2. **Documentation**

   - Comprehensive user guide
   - API documentation for developers
   - Best practices and tips

3. **Support Channels**
   - Email support: support@mini-crm.com
   - Live chat (premium users)
   - Community forum
   - Video call support (enterprise)

### Best Practices

1. **Data Quality**

   - Regularly clean customer data
   - Validate email addresses
   - Remove inactive subscribers
   - Update customer preferences

2. **Campaign Optimization**

   - A/B test subject lines
   - Segment audiences appropriately
   - Monitor delivery times
   - Track and analyze results

3. **Compliance**

   - Obtain proper consent
   - Include unsubscribe links
   - Honor opt-out requests promptly
   - Maintain privacy policies

4. **Security**
   - Use strong passwords
   - Enable two-factor authentication
   - Regularly review user access
   - Monitor for suspicious activity

---

## Appendix

### Keyboard Shortcuts

- `Ctrl + /` (Windows) or `Cmd + /` (Mac): Open help
- `Ctrl + K` (Windows) or `Cmd + K` (Mac): Quick search
- `Esc`: Close modals and overlays
- `Tab`: Navigate through form fields

### Browser Support

- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

### Mobile Access

The platform is responsive and works on mobile devices, though the full desktop experience is recommended for complex tasks like campaign creation and analytics review.
