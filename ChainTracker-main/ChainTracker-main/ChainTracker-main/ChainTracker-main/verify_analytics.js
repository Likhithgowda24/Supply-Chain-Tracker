const BASE_URL = 'http://localhost:5007';

async function run() {
    try {
        // 1. Sign up/Login Manufacturer
        console.log('Logging in manufacturer...');
        const mfgRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "mfg_analytics",
                password: "password123",
                role: "manufacturer",
                email: "mfg_analytics@example.com",
                securityQuestion: "q",
                securityAnswer: "a"
            })
        });

        let token;
        if (mfgRes.ok) {
            const data = await mfgRes.json();
            token = data.accessToken;
        } else {
            console.log('Signup failed, trying login...');
            const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "mfg_analytics",
                    password: "password123"
                })
            });
            const data = await loginRes.json();
            token = data.accessToken;
        }
        console.log('Manufacturer logged in.');

        // 2. Fetch Analytics
        console.log('Fetching analytics...');
        const analyticsRes = await fetch(`${BASE_URL}/api/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (analyticsRes.ok) {
            const data = await analyticsRes.json();
            console.log('Analytics Data:', JSON.stringify(data, null, 2));
        } else {
            console.error('Failed to fetch analytics:', await analyticsRes.text());
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
