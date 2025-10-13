import React, { useState } from "react";
import axios from "axios";
import { FaFileUpload, FaCheckCircle } from "react-icons/fa";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [csvUrl, setCsvUrl] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setError("");
    setLoading(true);
    setTransactions([]);
    setCsvUrl("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const txs = Array.isArray(res.data.transactions)
          ? res.data.transactions
          : [];

        // Ensure all values are strings or numbers (avoid React object error)
        const safeTxs = txs.map((tx) => ({
          ...tx,
          date: String(tx.date || ""),
          description: String(tx.description || ""),
          amount: String(tx.amount || ""),
          type: String(tx.type || ""),
          balance: String(tx.balance || ""),
        }));

        setTransactions(safeTxs);
        setCsvUrl(res.data.csvUrl || "");
      } else {
        setError(res.data.error || "Failed to extract data");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Server Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>📄 PDF Transaction Extractor</h1>
      <p className="subtitle">Upload a bank statement PDF and extract transactions automatically.</p>

      <div
        className="upload-box"
        onClick={() => document.getElementById("fileInput").click()}
      >
        <FaFileUpload size={40} color="#2563eb" />
        <p>{file ? file.name : "Click or drag a PDF file here"}</p>
        <input
          type="file"
          id="fileInput"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      <button className="upload-btn" onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload & Extract"}
      </button>

      {error && <p className="error">{error}</p>}

      {csvUrl && (
        <div className="success">
          <FaCheckCircle color="green" />{" "}
          <a href={csvUrl} download target="_blank" rel="noreferrer">
            Download Extracted CSV
          </a>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="table-container">
          <h3>Extracted Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td>{tx.type}</td>
                  <td>{tx.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
