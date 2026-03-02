import jwt from 'jsonwebtoken';

// Sesuaikan dengan JWT_SECRET yang mungkin digunakan di app Anda
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_123';

/**
 * Membuat token JWT palsu untuk digunakan dalam header Authorization
 * @param {Object} payload Data user yang ingin dimasukkan ke token (misal: user_id, role)
 * @returns {string} Bearer token
 */
export const generateMockToken = (payload = { 
    id: 1, 
    userId: 'mock-uuid-1234', 
    role: 'ADMIN',
    email: 'admin@test.com'
}) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};
