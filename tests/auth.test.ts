import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server/index';

const JWT_SECRET = process.env.MAGIC_LINK_JWT_SECRET || process.env.SESSION_SECRET || 'test-secret';

describe('Authentication Flow', () => {
  let testToken: string;
  let sessionCookie: string;

  beforeAll(() => {
    // Create a test JWT token
    const payload = {
      userId: 'test-user-123',
      email: 'test@bluetradie.com',
      redirect: '/onboarding',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000)
    };
    testToken = jwt.sign(payload, JWT_SECRET);
  });

  test('Magic link verification sets session cookie and redirects', async () => {
    const response = await request(app)
      .get(`/auth/verify?token=${encodeURIComponent(testToken)}`)
      .expect(302); // Redirect

    // Check that session cookie is set
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    const btSessCookie = cookies.find((cookie: string) => cookie.startsWith('bt_sess='));
    expect(btSessCookie).toBeDefined();
    
    // Store cookie for subsequent tests
    sessionCookie = btSessCookie.split(';')[0];
    
    // Check redirect location
    expect(response.headers.location).toBe('/onboarding');
  });

  test('Authenticated API call returns user data', async () => {
    if (!sessionCookie) {
      throw new Error('Session cookie not set from previous test');
    }

    const response = await request(app)
      .get('/api/auth/user')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('isOnboarded');
    expect(response.body.userId).toBe('test-user-123');
    expect(response.body.email).toBe('test@bluetradie.com');
  });

  test('Unauthenticated API call returns 401', async () => {
    await request(app)
      .get('/api/auth/user')
      .expect(401);
  });

  test('First-run endpoint works with valid session', async () => {
    if (!sessionCookie) {
      throw new Error('Session cookie not set from previous test');
    }

    const response = await request(app)
      .get('/api/user/first-run')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toHaveProperty('showWelcome');
    expect(typeof response.body.showWelcome).toBe('boolean');
  });

  test('Invalid JWT token redirects to login with error', async () => {
    const invalidToken = 'invalid.jwt.token';
    
    const response = await request(app)
      .get(`/auth/verify?token=${encodeURIComponent(invalidToken)}`)
      .expect(302);
    
    expect(response.headers.location).toBe('/login');
  });

  test('Expired JWT token redirects to login', async () => {
    const expiredPayload = {
      userId: 'test-user-123',
      email: 'test@bluetradie.com',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200
    };
    const expiredToken = jwt.sign(expiredPayload, JWT_SECRET);
    
    const response = await request(app)
      .get(`/auth/verify?token=${encodeURIComponent(expiredToken)}`)
      .expect(302);
    
    expect(response.headers.location).toBe('/login');
  });
});