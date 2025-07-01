const fs = require('fs');
const axios = require('axios');

async function testVerify() {
  try {
    const artifactPath = 'contracts/out/Counter.sol/Counter.json';
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const contractAddress = '0x8464135c8F25Da09e49BC8782676a84730C318bC';

    const response = await axios.post('http://localhost:3001/api/quickActions/verify', {
      contractAddress,
      artifact
    });

    console.log('Verify response:', response.data);
  } catch (error) {
    console.error('Error during verify test:', error.response ? error.response.data : error.message);
  }
}

testVerify();
