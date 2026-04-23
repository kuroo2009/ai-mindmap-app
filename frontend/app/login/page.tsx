'use client';
import React, { useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import './LoginSignup.css';

const LoginSignup = () => {
  const [action, setAction] = useState("Login"); // Mặc định để Login cho tiện
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
  );

  const handleSubmit = async () => {
    if (action === "Sign Up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: username } }
      });
      if (error) alert(error.message);
      else alert("Đăng ký thành công! Hãy kiểm tra Email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = "/"; // Đăng nhập xong thì về trang chủ
    }
  };

  return (
    <div className="container">
      <div className="header">
        <br/>
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>
      
      <div className="inputs">
        {action === "Sign Up" && (
          <div className="input">
            <input className="username-input"
              type="text" 
              placeholder="Username" 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
        )}
        
        <div className="input">
          <input className="email-input"
            type="email" 
            placeholder="Email" 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        
        <div className="input">
          <input className="password-input"
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
      </div>
      
      {action === "Sign Up" && (
          <div className="forgot-password">
            Đã có tài khoản? <span onClick={() => setAction("Login")}>Bấm vào đây</span>
          </div>
        )}

      {action === "Login" && (
        <div className="forgot-password">
          Quên mật khẩu? <span>Bấm vào đây</span>
        </div>
      )}

      <div className="submit-container">
        {/* Nút bấm thông minh: Nếu đang ở mode Sign Up mà bấm Sign Up thì thực thi, nếu không thì chuyển mode */}
        <div 
          className={action === "Login" ? "submit gray" : "submit"} 
          onClick={() => action === "Sign Up" ? handleSubmit() : setAction("Sign Up")}
        >
          Sign Up
        </div>
        
        <div 
          className={action === "Sign Up" ? "submit gray" : "submit"} 
          onClick={() => action === "Login" ? handleSubmit() : setAction("Login")}
        >
          Login
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;