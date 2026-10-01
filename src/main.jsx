import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ConvexAuthProvider, useAuthToken, useConvexAuth as useVantaAuth } from "@convex-dev/auth/react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback } from "react";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const legacyVantaUrl = import.meta.env.VITE_VANTA_CONVEX_URL;
const vantaDevUrl = import.meta.env.VITE_VANTA_DEV_CONVEX_URL || (import.meta.env.DEV ? legacyVantaUrl : undefined);
const vantaProdUrl = import.meta.env.VITE_VANTA_PROD_CONVEX_URL || (!import.meta.env.DEV ? legacyVantaUrl : undefined);
const canSwitchVantaEnvironment = Boolean(import.meta.env.DEV && vantaDevUrl && vantaProdUrl);
const savedVantaEnvironment = canSwitchVantaEnvironment
  ? window.localStorage.getItem("reva-vanta-environment")
  : null;
const vantaEnvironment = canSwitchVantaEnvironment
  ? savedVantaEnvironment === "production" ? "production" : "development"
  : import.meta.env.DEV && vantaDevUrl ? "development" : "production";
const vantaConvexUrl = canSwitchVantaEnvironment
  ? (vantaEnvironment === "production" ? vantaProdUrl : vantaDevUrl)
  : (import.meta.env.DEV ? vantaDevUrl || vantaProdUrl || legacyVantaUrl : vantaProdUrl || legacyVantaUrl);
if (!convexUrl || !vantaConvexUrl) {
  throw new Error("VITE_CONVEX_URL and a Vanta Convex URL are required to connect Reva and Vanta authentication.");
}
const revaClient = new ConvexReactClient(convexUrl);
const vantaClient = new ConvexReactClient(vantaConvexUrl);

function switchVantaEnvironment(environment) {
  if (!canSwitchVantaEnvironment || !["development", "production"].includes(environment)) return;
  window.localStorage.setItem("reva-vanta-environment", environment);
  window.location.reload();
}

function RevaAuthBridge({ children }) {
  const token = useAuthToken();
  const { isLoading, isAuthenticated } = useVantaAuth();
  const fetchAccessToken = useCallback(async () => token, [token]);
  const useVantaToken = useCallback(() => ({
    isLoading,
    isAuthenticated,
    fetchAccessToken,
  }), [isLoading, isAuthenticated, fetchAccessToken]);

  return <ConvexProviderWithAuth client={revaClient} useAuth={useVantaToken}>{children}</ConvexProviderWithAuth>;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Reva Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F5F2",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          padding: 24
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 32,
            maxWidth: 550,
            width: "100%",
            boxShadow: "0 10px 30px -10px rgba(28,27,25,0.15)",
            border: "1px solid rgba(28,27,25,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#DC2626" }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1D1B18" }}>
                Reva Interface Notice
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "#605E5B", marginBottom: 16 }}>
              A client runtime error occurred while rendering the intelligence interface.
            </p>
            <div style={{
              background: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#DC2626",
              fontFamily: "monospace",
              marginBottom: 20,
              wordBreak: "break-word"
            }}>
              {this.state.error?.message || "Unknown rendering exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#FF6A13",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConvexAuthProvider client={vantaClient}>
        <RevaAuthBridge>
          <App
            vantaEnvironment={vantaEnvironment}
            canSwitchVantaEnvironment={canSwitchVantaEnvironment}
            onSwitchVantaEnvironment={switchVantaEnvironment}
          />
        </RevaAuthBridge>
      </ConvexAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
