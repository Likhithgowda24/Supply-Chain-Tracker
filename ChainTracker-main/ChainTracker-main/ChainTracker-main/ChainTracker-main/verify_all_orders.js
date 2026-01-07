const BASE_URL = 'http://localhost:5004';

async function run() {
    try {
        // 1. Signup Manufacturer
        console.log('Signing up manufacturer...');
        const mfgRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'mfg_node_2',
                email: 'mfg_node_2@example.com',
                password: 'password123',
                role: 'manufacturer',
                securityQuestion: 'q',
                securityAnswer: 'a'
            })
        });
        const mfgData = await mfgRes.json();
        if (!mfgRes.ok) throw new Error(`Mfg Signup Failed: ${JSON.stringify(mfgData)}`);
        const mfgToken = mfgData.accessToken;
        console.log('Mfg Token obtained');

        // 2. Create Product
        console.log('Creating product...');
        const prodRes = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mfgToken}`
            },
            body: JSON.stringify({
                productId: 'PROD-NODE-2',
                name: 'Node Product 2',
                description: 'Desc',
                price: 100,
                category: 'Test',
                stock: 10,
                image: 'img'
            })
        });
        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(`Product Create Failed: ${JSON.stringify(prodData)}`);
        console.log('Product created:', prodData.id);

        // 3. Signup Customer
        console.log('Signing up customer...');
        const custRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'cust_node_2',
                email: 'cust_node_2@example.com',
                password: 'password123',
                role: 'customer',
                securityQuestion: 'q',
                securityAnswer: 'a'
            })
        });
        const custData = await custRes.json();
        if (!custRes.ok) throw new Error(`Cust Signup Failed: ${JSON.stringify(custData)}`);
        const custToken = custData.accessToken;
        console.log('Cust Token obtained');

        // 4. Place Order
        console.log('Placing order...');
        const orderRes = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${custToken}`
            },
            body: JSON.stringify({
                productId: 'PROD-NODE-2',
                quantity: 1,
                shippingAddress: {},
                location: {}
            })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(`Order Place Failed: ${JSON.stringify(orderData)}`);
        console.log('Order placed:', orderData.orderId);

        // 5. Get All Orders
        console.log('Fetching all orders...');
        const allOrdersRes = await fetch(`${BASE_URL}/api/manufacturer/all-orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${mfgToken}`
            }
        });
        const allOrdersData = await allOrdersRes.json();
        if (!allOrdersRes.ok) throw new Error(`Get All Orders Failed: ${JSON.stringify(allOrdersData)}`);

        console.log('All Orders Count:', allOrdersData.length);
        console.log(JSON.stringify(allOrdersData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
