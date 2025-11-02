const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

async function testContractorTenderAccess() {
    try {
        console.log('🧪 Testing contractor tender access...\n');

        // First, login as a contractor
        console.log('1. Logging in as contractor...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'contractor@platform.com',
            password: 'contractor123'
        }).catch(err => {
            console.error('Login error details:', err.response?.data || err.message);
            throw err;
        });

        const token = loginResponse.data.token;
        console.log('✅ Contractor login successful');

        // Test accessing tenders
        console.log('\n2. Accessing tenders as contractor...');
        const tendersResponse = await axios.get(`${BASE_URL}/tenders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(err => {
            console.error('Tenders request error details:', err.response?.data || err.message);
            throw err;
        });

        console.log('✅ Tenders request successful!');
        console.log('📊 Response structure:', {
            hasData: !!tendersResponse.data,
            isArray: Array.isArray(tendersResponse.data),
            hasVerificationInfo: !!(tendersResponse.data.canBid !== undefined),
            tenderCount: Array.isArray(tendersResponse.data) 
                ? tendersResponse.data.length 
                : (tendersResponse.data.tenders ? tendersResponse.data.tenders.length : 0)
        });

        if (tendersResponse.data.canBid !== undefined) {
            console.log('🔍 Verification Status:');
            console.log('  - Can Bid:', tendersResponse.data.canBid);
            console.log('  - Message:', tendersResponse.data.verificationMessage);
            console.log('  - Tenders Available:', tendersResponse.data.tenders?.length || 0);
        }

        console.log('\n✅ Test completed successfully! Contractors can now view tenders.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status === 403) {
            console.error('🚫 Still getting 403 - access denied');
        }
        console.error('Full error:', error.message);
    }
}

testContractorTenderAccess();