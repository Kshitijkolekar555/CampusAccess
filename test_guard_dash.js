const http = require('http');

function post(url, data) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const loginRes = await post('http://localhost:8081/api/v1/auth/login', JSON.stringify({ username: 'guard1', password: 'Guard123!' }));
    console.log('Login body:', JSON.stringify(loginRes.body, null, 2));
    const token = loginRes.body?.data?.accessToken || loginRes.body?.data?.token;
    console.log('Using token:', token ? token.substring(0, 15) + '...' : 'none');
    const dashRes = await get('http://localhost:8081/api/v1/dashboard/guard', token);
    console.log('Guard dashboard status:', dashRes.status);
    console.log('Guard dashboard body:', JSON.stringify(dashRes.body, null, 2));
}

main().catch(console.error);
