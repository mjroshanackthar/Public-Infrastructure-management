const axios = require('axios');

async function verifyXYZ() {
  try {
    console.log('🧪 Verifying XYZ Engineering...');

    // Login as verifier
    const verifierLogin = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'verifier@platform.com',
      password: 'verifier123'
    });

    // Get all contractors to find XYZ Engineering
    const contractors = await axios.get('http://localhost:5002/api/contractors', {
      headers: { 'Authorization': `Bearer ${verifierLogin.data.token}` }
    });

    const xyzContractor = contractors.data.find(c => c.email === 'contractor2@platform.com');
    if (!xyzContractor) {
      console.log('❌ XYZ Engineering not found');
      return;
    }

    console.log(`Found XYZ Engineering: ${xyzContractor.name} - Current status: ${xyzContractor.isVerified ? 'Verified' : 'Unverified'}`);

    // Verify XYZ Engineering
    const response = await axios.put(
      `http://localhost:5002/api/contractors/${xyzContractor._id}/verification-status`,
      {
        isVerified: true,
        verificationNotes: 'Verified by test script'
      },
      {
        headers: { 'Authorization': `Bearer ${verifierLogin.data.token}` }
      }
    );

    console.log('✅ XYZ Engineering verified successfully');

    // Test login again
    const xyzLogin = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'contractor2@platform.com',
      password: 'contractor123'
    });
    console.log(`✅ XYZ Engineering new login status: ${xyzLogin.data.user.isVerified ? 'Verified' : 'Unverified'}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

verifyXYZ();