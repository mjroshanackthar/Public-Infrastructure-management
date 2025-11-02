const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

async function testVerificationEndpoint() {
    try {
        console.log('🧪 Testing verification endpoint...\n');

        // First, login as a verifier
        console.log('1. Logging in as verifier...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'verifier@platform.com',
            password: 'verifier123'
        }).catch(err => {
            console.error('Login error:', err.message);
            throw new Error('Cannot connect to backend server. Is it running on port 5002?');
        });

        const token = loginResponse.data.token;
        console.log('✅ Verifier login successful\n');

        // Test verification requests endpoint
        console.log('2. Fetching verification requests...');
        const requestsResponse = await axios.get(`${BASE_URL}/verification/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(err => {
            console.error('Verification requests error:', err.response?.data || err.message);
            throw err;
        });

        console.log('✅ Verification requests loaded successfully!');
        console.log('📊 Found', requestsResponse.data.length, 'verification requests');
        
        if (requestsResponse.data.length > 0) {
            console.log('\nSample request:');
            console.log(JSON.stringify(requestsResponse.data[0], null, 2));
        }

        console.log('\n✅ All tests passed! Verification endpoint is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔴 Backend server is not running!');
            console.error('💡 Start the server with: npm start');
        }
    }
}

testVerificationEndpoint();