const jwt = require('jsonwebtoken');

const payload = {
  id: 'user_id_example',
  name: 'John Doe'
};

const secret = 'your_secret_key'; 
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('JWT Token:', token);
