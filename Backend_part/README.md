# Blockchain Building Platform - MongoDB Backend

A complete Node.js/Express backend with MongoDB for the Blockchain Building Platform.

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Install Dependencies
```bash
cd Backend_part
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/blockchain_building_platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:

**Local MongoDB:**
```bash
# On Windows
net start MongoDB

# On macOS (with Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas (cloud):**
- Create account at https://www.mongodb.com/atlas
- Create cluster and get connection string
- Update MONGODB_URI in .env

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will start on http://localhost:5000

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Tenders
- `GET /api/tenders` - Get all tenders
- `POST /api/tenders/create-with-days` - Create new tender
- `GET /api/tenders/:id/bids` - Get tender bids
- `POST /api/tenders/:id/bid` - Submit bid
- `POST /api/tenders/:id/assign` - Assign winner

### Contractors
- `GET /api/contractors` - Get all contractors
- `GET /api/contractors/:address` - Get contractor details
- `GET /api/contractors/verification/status` - Get verification status

### Credentials
- `POST /api/credentials/add` - Add credential
- `GET /api/credentials/status/:address/:type` - Get credential status
- `GET /api/debug/verifiers` - Get verifiers
- `POST /api/debug/add-verifier` - Add verifier
- `POST /api/debug/manual-verify-certificate` - Verify credential

### System
- `GET /health` - Health check
- `GET /api/blockchain/status` - Blockchain status
- `GET /api/contracts` - Contract status

## 🗄️ Database Models

### User Model
- Authentication and user management
- Roles: admin, verifier, contractor, public
- Password hashing with bcrypt
- JWT token generation

### Tender Model
- Tender creation and management
- Embedded bids schema
- Status tracking (Open, Closed, Awarded, Cancelled)
- Budget and deadline management

### Credential Model
- Certificate management
- Multi-verifier system
- Verification tracking
- Expiry date management

## 🔐 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Role-based authorization

## 🧪 Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "organization": "Building Authority"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. Use the Token
Copy the token from login response and use it in subsequent requests:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 📁 Project Structure

```
Backend_part/
├── models/
│   ├── User.js          # User model with authentication
│   ├── Tender.js        # Tender and bids model
│   └── Credential.js    # Credential verification model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── tenders.js       # Tender management routes
│   ├── contractors.js   # Contractor routes
│   ├── credentials.js   # Credential routes
│   ├── projects.js      # Project routes
│   ├── blockchain.js    # Blockchain status routes
│   └── debug.js         # Debug and testing routes
├── middleware/
│   └── auth.js          # Authentication middleware
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🔄 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **Authentication**: JWT-based auth system
2. **Role-based Access**: Admin, Verifier, Contractor roles
3. **Real-time Data**: MongoDB for persistent storage
4. **API Compatibility**: Matches all frontend API calls

## 🚀 Next Steps

1. **Start MongoDB** on your system
2. **Install dependencies** with `npm install`
3. **Configure environment** variables in `.env`
4. **Start the server** with `npm run dev`
5. **Test endpoints** using the examples above
6. **Start the frontend** and see everything working together!

The backend will handle all authentication, data persistence, and business logic while your frontend provides the user interface.