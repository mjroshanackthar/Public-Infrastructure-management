const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

// Test access restrictions for contractor endpoints
async function testAccessRestrictions() {
  console.log('Testing contractor access restrictions...\n');

  // Test data - you'll need to replace these with actual user tokens
  const testUsers = {
    contractor: null, // Will be set after login
    verifier: null,   // Will be set after login
    admin: null       // Will be set after login
  };

  try {
    // Login as contractor
    console.log('1. Logging in as contractor...');
    const contractorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'contractor@platform.com',
      password: 'contractor123'
    });
    testUsers.contractor = contractorLogin.data.token;
    console.log('✓ Contractor login successful');

    // Login as verifier
    console.log('2. Logging in as verifier...');
    const verifierLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'verifier@platform.com',
      password: 'verifier123'
    });
    testUsers.verifier = verifierLogin.data.token;
    console.log('✓ Verifier login successful');

    // Test contractor trying to access contractor list (should fail)
    console.log('\n3. Testing contractor access to contractor list...');
    try {
      await axios.get(`${BASE_URL}/contractors`, {
        headers: { Authorization: `Bearer ${testUsers.contractor}` }
      });
      console.log('✗ FAIL: Contractor should not be able to access contractor list');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ PASS: Contractor correctly denied access to contractor list');
      } else {
        console.log('✗ UNEXPECTED ERROR:', error.message);
      }
    }

    // Test verifier accessing contractor list (should succeed)
    console.log('4. Testing verifier access to contractor list...');
    try {
      const response = await axios.get(`${BASE_URL}/contractors`, {
        headers: { Authorization: `Bearer ${testUsers.verifier}` }
      });
      console.log('✓ PASS: Verifier can access contractor list');
      console.log(`   Found ${response.data.length} contractors`);
    } catch (error) {
      console.log('✗ FAIL: Verifier should be able to access contractor list');
      console.log('   Error:', error.response?.data?.message || error.message);
    }

    // Test contractor trying to access verification status (should fail)
    console.log('5. Testing contractor access to verification status...');
    try {
      await axios.get(`${BASE_URL}/contractors/verification/status`, {
        headers: { Authorization: `Bearer ${testUsers.contractor}` }
      });
      console.log('✗ FAIL: Contractor should not be able to access verification status');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ PASS: Contractor correctly denied access to verification status');
      } else {
        console.log('✗ UNEXPECTED ERROR:', error.message);
      }
    }

    // Test verifier accessing verification status (should succeed)
    console.log('6. Testing verifier access to verification status...');
    try {
      const response = await axios.get(`${BASE_URL}/contractors/verification/status`, {
        headers: { Authorization: `Bearer ${testUsers.verifier}` }
      });
      console.log('✓ PASS: Verifier can access verification status');
      console.log(`   Total contractors: ${response.data.totalContractors}`);
      console.log(`   Verified: ${response.data.verifiedContractors}`);
    } catch (error) {
      console.log('✗ FAIL: Verifier should be able to access verification status');
      console.log('   Error:', error.response?.data?.message || error.message);
    }

    // Test contractor accessing their own profile (should succeed)
    console.log('7. Testing contractor access to own profile...');
    try {
      const contractorId = contractorLogin.data.user._id;
      const response = await axios.get(`${BASE_URL}/contractors/${contractorId}`, {
        headers: { Authorization: `Bearer ${testUsers.contractor}` }
      });
      console.log('✓ PASS: Contractor can access their own profile');
      console.log(`   Name: ${response.data.name}`);
    } catch (error) {
      console.log('✗ FAIL: Contractor should be able to access their own profile');
      console.log('   Error:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Access restriction tests completed!');

  } catch (error) {
    console.error('Test setup error:', error.response?.data?.message || error.message);
  }
}

// Run the tests
testAccessRestrictions();