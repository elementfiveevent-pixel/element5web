// Node.js Load Test Script (No k6 required)
// Run with: node load-test.js

const https = require('https');
const http = require('http');

const BASE_URL = 'https://rtvrdbbojqsrbkngnjgq.supabase.co/functions/v1';
const CONCURRENT_USERS = 50; // Start small, increase if needed
const TEST_DURATION_MS = 30000; // 30 seconds

let successCount = 0;
let failCount = 0;
let totalLatency = 0;
let activeRequests = 0;
let isRunning = true;

const agent = new https.Agent({ keepAlive: true });

function makeRequest() {
    if (!isRunning) return;

    const start = Date.now();
    const req = https.request(`${BASE_URL}/health_check`, { method: 'GET', agent }, (res) => {
        res.on('data', () => { }); // Consume body
        res.on('end', () => {
            const latency = Date.now() - start;
            if (res.statusCode === 200) {
                successCount++;
                totalLatency += latency;
            } else {
                failCount++;
                console.log(`Failed: ${res.statusCode}`);
            }
            activeRequests--;
            // Immediately schedule next if still running to maintain concurrency
            if (isRunning) {
                activeRequests++;
                makeRequest();
            }
        });
    });

    req.on('error', (e) => {
        failCount++;
        console.error(`Error: ${e.message}`);
        activeRequests--;
        if (isRunning) {
            activeRequests++;
            makeRequest();
        }
    });

    req.end();
}

console.log(`Starting load test against: ${BASE_URL}/health_check`);
console.log(`Target: ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION_MS / 1000}s...`);

// Start concurrent users
for (let i = 0; i < CONCURRENT_USERS; i++) {
    activeRequests++;
    makeRequest();
}

// Stop after duration
setTimeout(() => {
    isRunning = false;
    console.log('\n--- Test Completed ---');
    console.log(`Total Requests: ${successCount + failCount}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Avg Latency: ${(totalLatency / (successCount || 1)).toFixed(2)}ms`);

    if (failCount > 0) process.exit(1);
}, TEST_DURATION_MS);
