import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../store/userSlice";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Gửi request đăng nhập
    axiosInstance
      .post("/auth/login", { username: email, password: password })
      .then((response) => {
        const data = response.data;
        console.log(data.data);
        // Lưu thông tin user vào Redux store
        dispatch(login(data.data));
        // Chuyển hướng đến trang chủ
        navigate("/");
      });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-xs">
        <h2 className="text-xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
