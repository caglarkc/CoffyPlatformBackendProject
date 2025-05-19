import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import exec from 'k6/execution';

// Custom metrics
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const successfulRegistrations = new Counter('successful_registrations');
const failedRegistrations = new Counter('failed_registrations');
const authDuration = new Trend('auth_duration');
const registerDuration = new Trend('register_duration');

// Test configuration - tek bir test için
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
  },
};

// Global variables for sharing auth data between VUs
let globalCreatorAuth = {
  refreshToken: '',
  adminId: '',
  role: 0,
  cookies: null
};

// Test setup - Creator login
export function setup() {
  const loginUrl = 'http://localhost:3001/api/v1/admin-auth/login';
  const creatorLoginData = {
    email: 'alicaglarkocer@gmail.com',
    password: 'Ali13032003_'
  };

  const params = {
    headers: { 
      'Content-Type': 'application/json'
    },
    redirects: 0
  };

  const loginResponse = http.post(loginUrl, JSON.stringify(creatorLoginData), params);

  check(loginResponse, {
    'Creator login successful': (r) => r.status === 200,
    'Response structure valid': (r) => {
      if (r.status !== 200) return false;
      const body = JSON.parse(r.body);
      return body.message === "Giriş yapıldı" && 
             body.admin && 
             body.tokenPair && 
             body.tokenPair.refreshToken &&
             body.adminId;
    }
  });

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    const cookies = loginResponse.cookies;
    
    // Cookie'leri logla
    console.log('Received cookies:', JSON.stringify(cookies));

    globalCreatorAuth = {
      refreshToken: body.tokenPair.refreshToken,
      adminId: body.adminId,
      role: body.admin.role,
      cookies: loginResponse.cookies
    };

    console.log('Creator login successful. Role:', body.admin.role);
  } else {
    console.log('Login failed:', loginResponse.body);
    return null;
  }

  return globalCreatorAuth;
}

// Main test function
export default function (data) {
  const baseUrl = 'http://localhost:3001/api/v1/admin-auth';

  // Generate unique admin data
  const adminData = {
    name: `Test${randomString(5)}`,
    surname: `Admin${randomString(5)}`,
    email: `test${randomString(8)}@test.com`,
    phone: `555${Math.floor(Math.random() * 10000000)}`,
    password: `Test${randomString(8)}!123`,
    city: 'Istanbul',
    region: 'Kadikoy',
    district: 'Caferaga',
    role: data.role > 0 ? data.role - 1 : 0 // Alt rol oluştur
  };

  console.log('Attempting to create admin:', adminData.email);

  // Register new admin
  const registerStart = new Date();
  const registerResponse = http.post(`${baseUrl}/create-admin`, JSON.stringify(adminData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.refreshToken}`,
      'Cookie': data.cookies ? Object.entries(data.cookies).map(([name, cookie]) => 
        `${name}=${cookie.value}`).join('; ') : ''
    }
  });
  authDuration.add(new Date() - registerStart);

  // Check registration
  const registerSuccess = check(registerResponse, {
    'Registration successful': (r) => r.status === 201 || r.status === 200,
    'Registration response valid': (r) => {
      if (r.status !== 201 && r.status !== 200) {
        console.log('Register failed:', r.body);
        return false;
      }
      const body = JSON.parse(r.body);
      return body.message && body.admin;
    }
  });

  if (registerSuccess) {
    successfulRegistrations.add(1);
    console.log('Admin created successfully');
  } else {
    failedRegistrations.add(1);
    console.log('Admin creation failed');
  }

  sleep(1);

  // Login with new admin
  if (registerSuccess) {
    const loginStart = new Date();
    const loginResponse = http.post(`${baseUrl}/login`, JSON.stringify({
      email: adminData.email,
      password: adminData.password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    registerDuration.add(new Date() - loginStart);

    // Check login exactly as per API structure
    const loginSuccess = check(loginResponse, {
      'Login successful': (r) => r.status === 200,
      'Login response valid': (r) => {
        if (r.status !== 200) {
          console.log('Login failed:', r.body);
          return false;
        }
        const body = JSON.parse(r.body);
        return body.message === "Giriş yapıldı" && 
               body.admin && 
               body.tokenPair && 
               body.tokenPair.refreshToken &&
               body.adminId;
      }
    });

    if (loginSuccess) {
      successfulLogins.add(1);
      console.log('New admin login successful');
    } else {
      failedLogins.add(1);
      console.log('New admin login failed');
    }
  }

  sleep(1);
}

// Test teardown - Logout creator
export function teardown(data) {
  const baseUrl = 'http://localhost:3001/api/v1/admin-auth';
  
  if (data && data.adminId) {
    const logoutResponse = http.get(`${baseUrl}/logout`, {
      headers: {
        'Authorization': `Bearer ${data.refreshToken}`,
        'Cookie': data.cookies ? Object.entries(data.cookies).map(([name, cookie]) => 
          `${name}=${cookie.value}`).join('; ') : ''
      }
    });

    check(logoutResponse, {
      'Logout successful': (r) => r.status === 200,
    });

    if (logoutResponse.status === 200) {
      console.log('Creator logout successful');
    } else {
      console.log('Creator logout failed:', logoutResponse.body);
    }
  }
}

// Test results report
export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      successfulRegistrations: data.metrics.successful_registrations.values.count,
      failedRegistrations: data.metrics.failed_registrations.values.count,
      successfulLogins: data.metrics.successful_logins.values.count,
      failedLogins: data.metrics.failed_logins.values.count,
      avgAuthDuration: data.metrics.auth_duration.values.avg,
      avgRegisterDuration: data.metrics.register_duration.values.avg,
    }, null, 2),
  };
} 