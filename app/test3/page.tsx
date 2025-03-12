"use client";

import React, { useContext, useState } from "react";
import { PLMSecureContext } from "@/context/PLMSecureContext";

const PLMSecureTestPage: React.FC = () => {
  const secureContext = useContext(PLMSecureContext);
  const [status, setStatus] = useState<string>("Not authenticated");
  const [derivedKey, setDerivedKey] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!secureContext || typeof secureContext.registerCredential !== "function") {
      setStatus("PLMSecureContext is not available.");
      return;
    }

    try {
      await secureContext.registerCredential("001122"); // Registers a new WebAuthn credential
      setStatus("✅ Registration successful! You can now authenticate.");
    } catch (error) {
      setStatus(`❌ Registration failed: ${(error as Error).message}`);
    }
  };

  const handleAuthenticate = async () => {
    if (!secureContext || typeof secureContext.authenticateCredential !== "function") {
      setStatus("PLMSecureContext is not available.");
      return;
    }

    try {
      const key: ArrayBuffer = await secureContext.authenticateCredential(); // Triggers WebAuthn authentication
      const decoder = new TextDecoder("utf-8");
      const decodedKey = decoder.decode(key);

      setDerivedKey(decodedKey);
      setStatus(`✅ Authenticated! Decoded key is ${decodedKey}`);
    } catch (error) {
      setStatus(`❌ Authentication failed: ${(error as Error).message}`);
    }
  };

  const testDecryption = async () => {
    if (!secureContext || typeof secureContext.setKey !== "function") {
      setStatus("PLMSecureContext is not available.");
      return;
    }

    if (!derivedKey) {
      setStatus("❌ No derived key available.");
      return;
    }

    try {
      setStatus("Wait..");
      const unlock: boolean = await secureContext.setKey(derivedKey);
      setStatus(unlock ? "Set and valid! Wow." : "Nope.");
    } catch (error) {
      setStatus(`❌ Authentication failed: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", textAlign: "center" }}>
      <h2>🔒 PalMirror Secure Test Page</h2>
      <p>Click &quot;Register&quot; to set up WebAuthn, then &quot;Authenticate&quot; to unlock PalMirror Secure storage.</p>

      <button
        onClick={handleRegister}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        Register WebAuthn
      </button>

      <button
        onClick={handleAuthenticate}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Authenticate
      </button>

      <button
        onClick={testDecryption}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#00bbbb",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Test decryption
      </button>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{status}</p>
    </div>
  );
};

export default PLMSecureTestPage;
