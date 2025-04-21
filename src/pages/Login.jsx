// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add at the top

import './Login.css';



const Login = () => {
  const navigate = useNavigate(); // Initialize navigator
  const [email, setEmail] = useState('member@gmail.com');
  const [password, setPassword] = useState('member');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Logging in with:', { email, password });
  
    if (email === 'member@gmail.com' && password === 'member') {
      // navigate('/admin');
      alert('use admin@gmail.com and password admin to login as admin');
      navigate('/member');
    } else if (email === 'admin@gmail.com' && password === 'admin') {
      // navigate('/admin');
      navigate('/admin');
    }else {
      // alert('Invalid credentials');
      navigate('/admin');
    }
  };
  

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <p className="register-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
