# Quick Start Guide

## Option 1: Run Without Blockchain (Recommended for Development)

Your application is configured to work with MongoDB only, no blockchain required!

### Steps:

1. **Start Backend Server**
   ```bash
   cd Backend_part
   npm start
   ```

2. **Start Frontend** (in a new terminal)
   ```bash
   cd Frontend_part
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002

### Login Credentials:

**Admin:**
- Email: admin@platform.com
- Password: admin123

**Verifier:**
- Email: verifier@platform.com
- Password: verifier123

**Quality Assurance:**
- Email: verifier2@platform.com
- Password: verifier123

**Contractor (Verified):**
- Email: contractor2@platform.com
- Password: contractor123

**Contractor (Unverified):**
- Email: contractor@platform.com
- Password: contractor123

---

## Option 2: Run With Blockchain (Full Features)

If you want to use blockchain features:

### Terminal 1 - Start Hardhat Node:
```bash
cd Backend_part
npx hardhat node
```
**Keep this running!**

### Terminal 2 - Deploy Contracts:
```bash
cd Backend_part
npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 3 - Start Backend:
```bash
cd Backend_part
npm start
```

### Terminal 4 - Start Frontend:
```bash
cd Frontend_part
npm start
```

---

## Setup Demo Data (Optional)

If you need to reset or create demo data:

```bash
cd Backend_part

# Create demo users
node scripts/setup-demo-users.js

# Create demo tenders
node scripts/setup-demo-tenders.js
```

---

## Troubleshooting

### Backend won't start
- Make sure MongoDB is running
- Check if port 5002 is available

### Frontend won't start
- Check if port 3000 is available
- Run `npm install` in Frontend_part folder

### Blockchain connection failed
- This is normal if you're not running Hardhat node
- Application will work in MongoDB-only mode

### Cannot connect to MongoDB
- Install MongoDB: https://www.mongodb.com/try/download/community
- Start MongoDB service
- Or use MongoDB Atlas (cloud)