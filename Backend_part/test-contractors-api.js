const axios = require('axios');

async function testContractorsAPI() {
  try {
    console.log('Testing contractors API...');
    
    // Login as verifier
    const login = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'verifier@platform.com',
      password: 'verifier123'
    });
    
    console.log('✅ Verifier logged in');
    
    // Get contractors
    const response = await axios.get('http://localhost:5002/api/contractors', {
      headers: { 'Authorization': `Bearer ${login.data.token}` }
    });
    
    console.log('✅ Contractors API response:');
    console.log('Sample contractor structure:');
    console.log(JSON.stringify(response.data[0], null, 2));
    
    response.data.forEach(c => {
      console.log(`- ${c.name} (${c.email}): ${c.isVerified ? 'Verified' : 'Unverified'} [ID: ${c._id}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testContractorsAPI();