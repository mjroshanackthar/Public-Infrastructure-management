const axios = require('axios');

async function forceRefreshTest() {
  try {
    console.log('🔄 Force refresh test - checking all contractor statuses...\n');

    // Test both contractors
    const contractors = [
      { name: 'ABC Construction', email: 'contractor@platform.com' },
      { name: 'XYZ Engineering', email: 'contractor2@platform.com' }
    ];

    for (const contractor of contractors) {
      console.log(`Testing ${contractor.name}:`);
      
      // 1. Login
      const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
        email: contractor.email,
        password: 'contractor123'
      });
      
      console.log(`  ✅ Login status: ${loginResponse.data.user.isVerified ? 'Verified' : 'Unverified'}`);
      
      // 2. Test /me endpoint
      const meResponse = await axios.get('http://localhost:5002/api/auth/me', {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
      });
      
      console.log(`  ✅ /me status: ${meResponse.data.user.isVerified ? 'Verified' : 'Unverified'}`);
      
      // 3. Check in contractors list
      const verifierLogin = await axios.post('http://localhost:5002/api/auth/login', {
        email: 'verifier@platform.com',
        password: 'verifier123'
      });
      
      const contractorsResponse = await axios.get('http://localhost:5002/api/contractors', {
        headers: { 'Authorization': `Bearer ${verifierLogin.data.token}` }
      });
      
      const contractorInList = contractorsResponse.data.find(c => c.email === contractor.email);
      console.log(`  ✅ In contractors list: ${contractorInList?.isVerified ? 'Verified' : 'Unverified'}`);
      console.log(`  📋 Database ID: ${contractorInList?._id}`);
      console.log('');
    }

    console.log('🎯 Summary:');
    console.log('If all statuses show "Verified" but frontend shows "Unverified",');
    console.log('the issue is frontend caching. Users need to:');
    console.log('1. Use the "Refresh Status" button on Dashboard');
    console.log('2. Or logout and login again');
    console.log('3. Or wait for the 30-second auto-refresh');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

forceRefreshTest();