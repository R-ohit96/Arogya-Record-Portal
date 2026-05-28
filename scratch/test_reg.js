import axios from 'axios';

const testRegistration = async () => {
  try {
    const userData = {
      role: 'PATIENT',
      aadhaarNumber: '111122223333',
      name: 'Integration Test',
      mobile: '9111111111',
      password: 'Password123',
      email: 'test@example.com',
      gender: 'Male',
      age: '30'
    };
    
    console.log('Sending registration request...');
    const response = await axios.post('http://localhost:4000/api/auth/register', userData);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
};

testRegistration();
