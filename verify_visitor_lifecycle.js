const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: headers
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function put(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'PUT',
      headers: headers
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: headers
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const BASE_URL = 'http://localhost:8081/api/v1';

async function runVerification() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END VERIFICATION ---');

  // 1. Guard Login
  const loginRes = await post(`${BASE_URL}/auth/login`, {
    username: 'guard1',
    password: 'Guard123!'
  });
  const token = loginRes.body.data.accessToken;

  // Helper to get active visitor count
  async function getActiveCount() {
    const dashRes = await get(`${BASE_URL}/dashboard/guard`, token);
    const count = dashRes.body.data.activeVisitorsInsideCampus;
    const activeListRes = await get(`${BASE_URL}/visitors/inside`, token);
    return { dashCount: count, activeInsideListCount: activeListRes.body.data.length };
  }

  const initial = await getActiveCount();
  console.log(`[Baseline] Live Count on Dashboard: ${initial.dashCount}, Active List count: ${initial.activeInsideListCount}`);

  // Scenario 1: Register/onboard a visitor without check-in (request-token)
  console.log('\n[Scenario 1] Visitor registers/requests token (onboarded but NOT checked in)...');
  const uniqueMobile1 = '98765' + Math.floor(10000 + Math.random() * 90000);
  const tokenReqRes = await post(`${BASE_URL}/visitors/request-token`, {
    name: 'Test PreRegistered Visitor',
    mobile: uniqueMobile1,
    purpose: 'Academic Discussion',
    hostName: 'Dr Sharma',
    hostDepartment: 'CE',
    hostType: 'FACULTY',
    gateId: 1,
    idProofType: 'Aadhaar Card',
    idProofNumber: 'AADHAAR-883311'
  });
  console.log('tokenReqRes status:', tokenReqRes.status, 'body:', tokenReqRes.body);
  const requestedPassId = tokenReqRes.body?.data?.id;
  console.log(`  Token created: Pass #${requestedPassId}, status: ${tokenReqRes.body?.data?.status}`);

  const postRegister = await getActiveCount();
  console.log(`  Dashboard live count after pre-registration: ${postRegister.dashCount}`);
  if (postRegister.dashCount === initial.dashCount) {
    console.log('  -> PASS: Pre-registration did NOT increment live visitor count!');
  } else {
    console.error('  -> FAIL: Pre-registration incorrectly incremented live count!');
  }

  // Scenario 2: Guard approves/checks in that visitor
  console.log('\n[Scenario 2] Guard approves and checks in visitor at gate...');
  const approveRes = await put(`${BASE_URL}/visitors/${requestedPassId}/approve`, {}, token);
  console.log(`  Approved pass: status=${approveRes.body.data?.status}, timeIn=${approveRes.body.data?.timeIn}`);

  const postCheckin1 = await getActiveCount();
  console.log(`  Dashboard live count after check-in: ${postCheckin1.dashCount}`);
  if (postCheckin1.dashCount === initial.dashCount + 1) {
    console.log('  -> PASS: Live visitor count successfully incremented by 1!');
  } else {
    console.error('  -> FAIL: Live count did not increment by 1!');
  }

  // Scenario 6: Repeat or retry check-in request (idempotency / duplicate check)
  console.log('\n[Scenario 6] Retry check-in request with same active mobile or pass approval...');
  const repeatApprove = await put(`${BASE_URL}/visitors/${requestedPassId}/approve`, {}, token);
  console.log(`  Repeat approve status: ${repeatApprove.status}, message: ${repeatApprove.body?.message}`);

  // Try duplicate check-in with same active mobile
  const dupCheckin = await post(`${BASE_URL}/visitors/check-in`, {
    name: 'Duplicate Visitor',
    mobile: uniqueMobile1,
    purpose: 'Attempted duplicate',
    hostName: 'Dr Sharma',
    hostDepartment: 'CE',
    hostType: 'FACULTY',
    gateId: 1,
    idProofType: 'PAN',
    idProofNumber: 'PAN-1234'
  }, token);
  
  if (dupCheckin.status >= 400) {
    console.log(`  -> PASS: Duplicate check-in rejected with status ${dupCheckin.status}:`, dupCheckin.body.message);
  } else {
    console.error('  -> FAIL: Duplicate check-in was allowed!');
  }

  const postRetry = await getActiveCount();
  console.log(`  Live count after retry attempts: ${postRetry.dashCount}`);
  if (postRetry.dashCount === postCheckin1.dashCount) {
    console.log('  -> PASS: Count did not increase twice!');
  } else {
    console.error('  -> FAIL: Count doubled!');
  }

  // Scenario 4: Check in another visitor
  console.log('\n[Scenario 4] Check in a second visitor directly at gate terminal...');
  const uniqueMobile2 = '98765' + Math.floor(10000 + Math.random() * 90000);
  const checkin2Res = await post(`${BASE_URL}/visitors/check-in`, {
    name: 'Second Verified Visitor',
    mobile: uniqueMobile2,
    purpose: 'Library Access',
    hostName: 'Librarian',
    hostDepartment: 'ADMIN',
    hostType: 'FACULTY',
    gateId: 1,
    idProofType: 'Driving License',
    idProofNumber: 'DL-9944'
  }, token);
  console.log('checkin2Res status:', checkin2Res.status, 'body:', checkin2Res.body);
  const secondPassId = checkin2Res.body?.data?.id;
  console.log(`  Checked in second visitor: Pass #${secondPassId}`);

  const postCheckin2 = await getActiveCount();
  console.log(`  Live count after second visitor check-in: ${postCheckin2.dashCount}`);
  if (postCheckin2.dashCount === postCheckin1.dashCount + 1) {
    console.log('  -> PASS: Count incremented by 1 for second visitor!');
  } else {
    console.error('  -> FAIL: Count did not increment for second visitor!');
  }

  // Scenario 5: Check out one visitor
  console.log('\n[Scenario 5] Check out one visitor...');
  const checkoutRes = await post(`${BASE_URL}/visitors/check-out`, {
    visitorId: secondPassId,
    gateId: 1
  }, token);
  console.log(`  Checkout recorded: status=${checkoutRes.body.data?.status}, timeOut=${checkoutRes.body.data?.timeOut}`);

  const postCheckout = await getActiveCount();
  console.log(`  Live count after checkout: ${postCheckout.dashCount}`);
  if (postCheckout.dashCount === postCheckin2.dashCount - 1) {
    console.log('  -> PASS: Count decremented by 1 upon checkout!');
  } else {
    console.error('  -> FAIL: Count did not decrement upon checkout!');
  }

  // Scenario 7: End-of-Day Closure verification
  console.log('\n[Scenario 7] Run End-of-Day Closure...');
  const eodRes = await post(`${BASE_URL}/visitors/eod-closure`, {}, token);
  console.log(`  EOD Closure response:`, eodRes.body.message || eodRes.body.data);

  const postEOD = await getActiveCount();
  console.log(`  Live count after EOD closure: ${postEOD.dashCount}`);
  if (postEOD.dashCount === 0) {
    console.log('  -> PASS: Auto-closed EOD visits excluded from active count (count is 0)!');
  } else {
    console.log(`  Active count is ${postEOD.dashCount}`);
  }

  console.log('\n--- VERIFICATION SUITE FINISHED ---');
}

runVerification().catch(err => {
  console.error('Verification script failed:', err);
});
