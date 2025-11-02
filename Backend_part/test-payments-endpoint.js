const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

async function testPaymentsEndpoint() {
    try {
        console.log('🧪 Testing payments endpoint...\n');

        // Test 1: Login as contractor
        console.log('1. Logging in as contractor...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'contractor2@platform.com',
            password: 'contractor123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Contractor login successful');
        console.log('   Full user object:', JSON.stringify(user, null, 2));
        console.log('   User ID (_id):', user._id);
        console.log('   User ID (id):', user.id);
        console.log('   User ID (userId):', user.userId);
        console.log('   Name:', user.name);

        // Test 2: Get contractor payments
        console.log('\n2. Fetching contractor payments...');
        const paymentsResponse = await axios.get(
            `${BASE_URL}/tenders/payments/contractor/${user.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('✅ Payments loaded successfully!');
        console.log('📊 Found', paymentsResponse.data.length, 'payments');
        
        if (paymentsResponse.data.length > 0) {
            console.log('\nSample payment:');
            console.log(JSON.stringify(paymentsResponse.data[0], null, 2));
        } else {
            console.log('\n💡 No payments found. This is normal if no tenders have been awarded to this contractor.');
        }

        // Test 3: Login as admin
        console.log('\n3. Logging in as admin...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@platform.com',
            password: 'admin123'
        });

        const adminToken = adminLoginResponse.data.token;
        console.log('✅ Admin login successful');

        // Test 4: Get all payments (admin)
        console.log('\n4. Fetching all payments (admin view)...');
        const allPaymentsResponse = await axios.get(
            `${BASE_URL}/tenders/payments/all`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        console.log('✅ All payments loaded successfully!');
        console.log('📊 Total payments:', allPaymentsResponse.data.length);

        console.log('\n✅ All tests passed! Payments endpoint is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status === 403) {
            console.error('🚫 Access denied - check permissions');
        }
    }
}

testPaymentsEndpoint();