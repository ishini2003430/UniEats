const axios = require('axios');

async function testRegistration() {
  try {
    const res = await axios.post('http://localhost:5000/api/users/register', {
      name: "Test Student",
      email: "test.student999@example.com",
      password: "password123",
      role: "student"
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response?.data || err.message);
  }
}

testRegistration();
