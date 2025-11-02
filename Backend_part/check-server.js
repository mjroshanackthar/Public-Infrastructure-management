const axios = require('axios');

async function checkServer() {
    try {
        console.log('🔍 Checking if backend server is running...\n');
        
        const response = await axios.get('http://localhost:5002/health', {
            timeout: 5000
        });
        
        console.log('✅ Backend server is running!');
        console.log('📊 Server status:', response.data.status);
        console.log('🗄️  MongoDB:', response.data.mongodb);
        console.log('⏱️  Uptime:', Math.floor(response.data.uptime), 'seconds');
        console.log('\n✅ Everything looks good!');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Backend server is NOT running!');
            console.error('\n🔴 The server is not responding on port 5002');
            console.error('\n💡 To fix this:');
            console.error('   1. Open a terminal');
            console.error('   2. Navigate to Backend_part folder');
            console.error('   3. Run: npm start');
            console.error('\n   Or use the command:');
            console.error('   cd Backend_part && npm start');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('❌ Server is not responding (timeout)');
            console.error('\n💡 The server might be starting up or crashed');
            console.error('   Try restarting it: npm start');
        } else {
            console.error('❌ Error checking server:', error.message);
        }
    }
}

checkServer();