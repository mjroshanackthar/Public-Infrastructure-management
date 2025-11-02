const axios = require('axios');

async function quickTest() {
    try {
        // Test login
        console.log('Testing login...');
        const response = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'contractor@platform.com',
            password: 'contractor123'
        });
        
        console.log('Login successful, token received');
        
        // Test tenders access
        const tendersResponse = await axios.get('http://localhost:5002/api/tenders', {
            headers: { 'Authorization': `Bearer ${response.data.token}` }
        });
        
        console.log('Tenders access successful!');
        console.log('Response type:', typeof tendersResponse.data);
        console.log('Has canBid property:', 'canBid' in tendersResponse.data);
        
        if (tendersResponse.data.canBid !== undefined) {
            console.log('✅ New format working - contractor gets verification status');
        } else {
            console.log('📋 Old format - direct array');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

quickTest();