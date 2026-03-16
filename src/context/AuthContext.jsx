import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const normalizeRole = (value) => {
  if (!value) {
    return "UNKNOWN";
  }

  if (typeof value === "object") {
    const objectRole = value.authority || value.role || value.name;
    return normalizeRole(objectRole);
  }

  return String(value).replace(/^ROLE_/, "").trim().toUpperCase();
};

const getUserFromToken = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    console.log("Decoded Token:", decodedToken);

    let extractedRole =
      decodedToken.role ||
      (Array.isArray(decodedToken.roles) && decodedToken.roles[0]) ||
      decodedToken.roles ||
      (Array.isArray(decodedToken.authorities) &&
        (decodedToken.authorities[0]?.authority || decodedToken.authorities[0])) ||
      decodedToken.authorities ||
      "UNKNOWN";

    extractedRole = normalizeRole(extractedRole);
    console.log("Normalized User Role:", extractedRole);

    return {
      username: decodedToken.username,
      role: extractedRole,
      cooperativeId: decodedToken.cooperativeId,
    };
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const decodedUser = getUserFromToken(storedToken);

    if (decodedUser) {
      setToken(storedToken);
      setUser(decodedUser);
    } else {
      localStorage.removeItem("token");
    }

    setIsLoading(false);
  }, []);

  const login = (newToken) => {
    const decodedUser = getUserFromToken(newToken);

    if (!decodedUser) {
      throw new Error("Invalid authentication token.");
    }

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
      isLoading,
    }),
    [token, user, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
