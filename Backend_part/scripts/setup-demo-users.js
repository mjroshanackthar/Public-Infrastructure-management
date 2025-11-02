const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const demoUsers = [
  // Admin accounts
  {
    name: 'System Administrator',
    email: 'admin@platform.com',
    password: 'admin123',
    role: 'admin',
    organization: 'Platform Administration',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Senior Admin',
    email: 'admin2@platform.com',
    password: 'admin123',
    role: 'admin',
    organization: 'Platform Administration',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    isVerified: true,
    isActive: true
  },

  // Verifier accounts
  {
    name: 'Certificate Verifier',
    email: 'verifier@platform.com',
    password: 'verifier123',
    role: 'verifier',
    organization: 'Verification Authority',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Quality Assurance Verifier',
    email: 'verifier2@platform.com',
    password: 'verifier123',
    role: 'verifier',
    organization: 'Quality Assurance Board',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Safety Inspector',
    email: 'verifier3@platform.com',
    password: 'verifier123',
    role: 'verifier',
    organization: 'Safety Inspection Authority',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    isVerified: true,
    isActive: true
  },

  // Contractor accounts
  {
    name: 'ABC Construction',
    email: 'contractor@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'ABC Construction Ltd',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    isVerified: false,
    isActive: true,
    rating: 0,
    completedProjects: 0
  },
  {
    name: 'XYZ Engineering',
    email: 'contractor2@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'XYZ Engineering Corp',
    walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    isVerified: true,
    isActive: true,
    rating: 4.8,
    completedProjects: 12
  },
  {
    name: 'BuildRight Solutions',
    email: 'contractor3@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'BuildRight Solutions Inc',
    walletAddress: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    isVerified: false,
    isActive: true,
    rating: 0,
    completedProjects: 0
  },
  {
    name: 'Elite Builders',
    email: 'contractor4@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'Elite Builders Group',
    walletAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    isVerified: true,
    isActive: true,
    rating: 4.5,
    completedProjects: 8
  },
  {
    name: 'Metro Construction',
    email: 'contractor5@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'Metro Construction Co',
    walletAddress: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    isVerified: false,
    isActive: true,
    rating: 0,
    completedProjects: 0
  },
  {
    name: 'Prime Infrastructure',
    email: 'contractor6@platform.com',
    password: 'contractor123',
    role: 'contractor',
    organization: 'Prime Infrastructure Ltd',
    walletAddress: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    isVerified: true,
    isActive: true,
    rating: 4.9,
    completedProjects: 15
  }
];

async function setupDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/corruptionless-building', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Drop the entire users collection to avoid index conflicts
    try {
      await mongoose.connection.db.collection('users').drop();
      console.log('🗑️  Dropped existing users collection');
    } catch (error) {
      console.log('ℹ️  Users collection does not exist, creating new one');
    }

    // Create demo users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`👤 Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
    }

    console.log('\n🎉 Demo users setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log('\n👑 ADMIN ACCOUNTS:');
    console.log('• admin@platform.com / admin123 (System Administrator)');
    console.log('• admin2@platform.com / admin123 (Senior Admin)');
    console.log('\n🛡️ VERIFIER ACCOUNTS:');
    console.log('• verifier@platform.com / verifier123 (Certificate Verifier)');
    console.log('• verifier2@platform.com / verifier123 (Quality Assurance)');
    console.log('• verifier3@platform.com / verifier123 (Safety Inspector)');
    console.log('\n🏗️ CONTRACTOR ACCOUNTS:');
    console.log('• contractor@platform.com / contractor123 (ABC Construction - Unverified)');
    console.log('• contractor2@platform.com / contractor123 (XYZ Engineering - Verified)');
    console.log('• contractor3@platform.com / contractor123 (BuildRight Solutions - Unverified)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDemoUsers();