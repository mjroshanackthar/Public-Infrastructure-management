const axios = require('axios');

async function testLoginStatus() {
  try {
    console.log('🧪 Testing login status for contractors...');

    // Test ABC Construction login
    console.log('\n1. Testing ABC Construction login...');
    const abcLogin = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'contractor@platform.com',
      password: 'contractor123'
    });
    console.log(`✅ ABC Construction login status: ${abcLogin.data.user.isVerified ? 'Verified' : 'Unverified'}`);
    console.log(`   User data: ${abcLogin.data.user.name} (${abcLogin.data.user.email})`);

    // Test XYZ Engineering login
    console.log('\n2. Testing XYZ Engineering login...');
    const xyzLogin = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'contractor2@platform.com',
      password: 'contractor123'
    });
    console.log(`✅ XYZ Engineering login status: ${xyzLogin.data.user.isVerified ? 'Verified' : 'Unverified'}`);
    console.log(`   User data: ${xyzLogin.data.user.name} (${xyzLogin.data.user.email})`);

    // Test /me endpoint for both
    console.log('\n3. Testing /me endpoint for ABC Construction...');
    const abcMe = await axios.get('http://localhost:5002/api/auth/me', {
      headers: { 'Authorization': `Bearer ${abcLogin.data.token}` }
    });
    console.log(`✅ ABC /me status: ${abcMe.data.user.isVerified ? 'Verified' : 'Unverified'}`);

    console.log('\n4. Testing /me endpoint for XYZ Engineering...');
    const xyzMe = await axios.get('http://localhost:5002/api/auth/me', {
      headers: { 'Authorization': `Bearer ${xyzLogin.data.token}` }
    });
    console.log(`✅ XYZ /me status: ${xyzMe.data.user.isVerified ? 'Verified' : 'Unverified'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLoginStatus();