import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const access_token = useSelector((state) => state.user.access_token);
  console.log("token from pr", access_token);

  return access_token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
