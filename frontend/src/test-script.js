import { ethers } from 'ethers';
import addresses from '../utils/addresses.json' assert { type: 'json' };
import contractsAbi from '../utils/abi/contracts.json' assert { type: 'json' };

async function test() {
    const provider = ethers.getDefaultProvider('sepolia');
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);
    
    // Using an arbitrary user address for testing
    const userAddress = '0x1234567890123456789012345678901234567890';
    const tokenAddress = Object.values(addresses)[1]; // Get some token address
    
    const depositFilter = coreContract.filters.Deposit(userAddress, tokenAddress);
    try {
        const depositEvents = await coreContract.queryFilter(depositFilter, 0, 'latest');
        console.log('Deposit events count:', depositEvents.length);
    } catch(e) {
        console.error('Error fetching events:', e);
    }
}
test();
