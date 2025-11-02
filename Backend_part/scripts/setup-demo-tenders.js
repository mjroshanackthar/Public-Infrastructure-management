const mongoose = require('mongoose');
const User = require('../models/User');
const Tender = require('../models/Tender');
require('dotenv').config();

const demoTenders = [
  {
    title: 'City Bridge Construction Project',
    description: 'Construction of a new pedestrian bridge over the main river. The project includes foundation work, steel structure assembly, and safety installations. Expected to handle 10,000+ pedestrians daily.',
    budget: '50.5',
    daysFromNow: 30,
    minQualificationScore: 80,
    maxBids: 8
  },
  {
    title: 'Municipal Building Renovation',
    description: 'Complete renovation of the old municipal building including electrical systems, plumbing, HVAC, and interior design. Building must remain partially operational during construction.',
    budget: '75.2',
    daysFromNow: 45,
    minQualificationScore: 70,
    maxBids: 6
  },
  {
    title: 'Highway Expansion Project',
    description: 'Expansion of Highway 101 from 2 lanes to 4 lanes over a 5-mile stretch. Includes new asphalt, lane markings, guardrails, and traffic management systems.',
    budget: '120.8',
    daysFromNow: 60,
    minQualificationScore: 90,
    maxBids: 5
  },
  {
    title: 'School Campus Development',
    description: 'Construction of a new elementary school campus including 3 buildings, playground, parking lot, and landscaping. Must meet all educational facility standards.',
    budget: '95.3',
    daysFromNow: 90,
    minQualificationScore: 85,
    maxBids: 7
  },
  {
    title: 'Water Treatment Plant Upgrade',
    description: 'Modernization of the existing water treatment facility with new filtration systems, chemical treatment units, and automated monitoring systems.',
    budget: '180.7',
    daysFromNow: 120,
    minQualificationScore: 95,
    maxBids: 4
  },
  {
    title: 'Public Park Infrastructure',
    description: 'Development of a new public park including walking trails, picnic areas, playground equipment, lighting systems, and irrigation for landscaping.',
    budget: '35.9',
    daysFromNow: 25,
    minQualificationScore: 60,
    maxBids: 10
  }
];

async function setupDemoTenders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/corruptionless-building', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find an admin user to be the creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please run setup-demo-users.js first');
      process.exit(1);
    }

    // Drop existing tenders
    try {
      await mongoose.connection.db.collection('tenders').drop();
      console.log('🗑️  Dropped existing tenders collection');
    } catch (error) {
      console.log('ℹ️  Tenders collection does not exist, creating new one');
    }

    // Create demo tenders
    for (const tenderData of demoTenders) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + tenderData.daysFromNow);

      const tender = new Tender({
        title: tenderData.title,
        description: tenderData.description,
        budget: tenderData.budget,
        deadline: deadline,
        creator: adminUser._id,
        creatorAddress: adminUser.walletAddress,
        minQualificationScore: tenderData.minQualificationScore,
        maxBids: tenderData.maxBids,
        status: 'Open'
      });

      await tender.save();
      console.log(`📋 Created tender: ${tenderData.title} (Budget: ${tenderData.budget} ETH)`);
    }

    console.log('\n🎉 Demo tenders setup completed!');
    console.log(`\n📊 Created ${demoTenders.length} tenders with various budgets and requirements`);
    console.log('💡 Verified contractors can now view and bid on these tenders');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDemoTenders();