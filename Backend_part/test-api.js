const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing tenders API...');
    
    // Test getting all tenders (should fail without auth)
    try {
      const response = await axios.get('http://localhost:5002/api/tenders');
      console.log('✅ Tenders API accessible');
      console.log(`Found ${response.data.length} tenders`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Tenders API properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test server health
    try {
      const response = await axios.get('http://localhost:5002/health');
      console.log('✅ Server health check passed');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();