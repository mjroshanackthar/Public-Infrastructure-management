const axios = require('axios');

async function testVerificationStatusChange() {
  try {
    console.log('🧪 Testing verification status change...');

    // First, login as a verifier
    console.log('1. Logging in as verifier...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'verifier@platform.com',
      password: 'verifier123'
    });

    const verifierToken = loginResponse.data.token;
    console.log('✅ Verifier logged in successfully');

    // Get all contractors
    console.log('2. Fetching all contractors...');
    const contractorsResponse = await axios.get('http://localhost:5002/api/contractors', {
      headers: { 'Authorization': `Bearer ${verifierToken}` }
    });

    const contractors = contractorsResponse.data;
    console.log(`✅ Found ${contractors.length} contractors`);

    // Find ABC Construction (should be unverified)
    const abcContractor = contractors.find(c => c.name === 'ABC Construction');
    if (!abcContractor) {
      console.log('❌ ABC Construction not found');
      return;
    }

    console.log(`3. ABC Construction current status: ${abcContractor.isVerified ? 'Verified' : 'Unverified'}`);

    // Change verification status
    console.log('4. Changing verification status...');
    const statusChangeResponse = await axios.put(
      `http://localhost:5002/api/contractors/${abcContractor._id}/verification-status`,
      {
        isVerified: !abcContractor.isVerified,
        verificationNotes: 'Status changed by test script'
      },
      {
        headers: { 'Authorization': `Bearer ${verifierToken}` }
      }
    );

    console.log('✅ Status change response:', statusChangeResponse.data.message);

    // Verify the change
    console.log('5. Verifying the change...');
    const updatedContractorsResponse = await axios.get('http://localhost:5002/api/contractors', {
      headers: { 'Authorization': `Bearer ${verifierToken}` }
    });

    const updatedAbcContractor = updatedContractorsResponse.data.find(c => c.name === 'ABC Construction');
    console.log(`✅ ABC Construction new status: ${updatedAbcContractor.isVerified ? 'Verified' : 'Unverified'}`);

    // Test contractor login to see if status is reflected
    console.log('6. Testing contractor login...');
    const contractorLoginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'contractor@platform.com',
      password: 'contractor123'
    });

    console.log(`✅ Contractor login status: ${contractorLoginResponse.data.user.isVerified ? 'Verified' : 'Unverified'}`);

    // Test /me endpoint
    console.log('7. Testing /me endpoint...');
    const meResponse = await axios.get('http://localhost:5002/api/auth/me', {
      headers: { 'Authorization': `Bearer ${contractorLoginResponse.data.token}` }
    });

    console.log(`✅ /me endpoint status: ${meResponse.data.user.isVerified ? 'Verified' : 'Unverified'}`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testVerificationStatusChange();