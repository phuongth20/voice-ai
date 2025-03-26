import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  //lấy token từ localStorage
  access_token: JSON.parse(localStorage.getItem("access_token")) || null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      //lấy thông tin user và token từ action

      state.access_token = action.payload.access_token;

      localStorage.setItem(
        "access_token",
        JSON.stringify(action.payload.access_token)
      ); // Lưu vào localStorage
    },
    logout: (state) => {
      state.access_token = null;
      localStorage.removeItem("access_token"); // Xóa khỏi localStorage khi logout
    },
  },
});

export const { login, logout } = userSlice.actions;

export default userSlice.reducer;
