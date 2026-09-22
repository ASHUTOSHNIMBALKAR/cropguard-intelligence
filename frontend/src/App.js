import React, { useState, useEffect } from 'react';

// STYLES (Embedded for easy copy-paste)
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f9fbf9', minHeight: '100vh' },
  header: { textAlign: 'center', color: '#2e7d32', marginBottom: '30px' },
  riskCard: (color) => ({ backgroundColor: color, color: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }),
  uploadBox: { border: '2px dashed #2e7d32', borderRadius: '15px', padding: '40px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white', marginBottom: '20px' },
  btn: { backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '10px' },
  voiceBtn: { backgroundColor: '#ff9800', marginTop: '10px' },
  resultCard: { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  langToggle: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }
};

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState({ risk: "Calculating...", color: "#9e9e9e" });
  const [lang, setLang] = useState('hi'); // 'hi' or 'mr'

  // 1. Fetch Location & Risk on Load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      fetch('http://localhost:8000/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      })
      .then(res => res.json())
      .then(data => {
        const colors = { "High": "#f44336", "Medium": "#ff9800", "Low": "#4caf50" };
        setRiskData({ risk: data.risk, color: colors[data.risk] || "#4caf50" });
      })
      .catch(() => setRiskData({ risk: "Low (Offline)", color: "#4caf50" }));
    }, () => {
      setRiskData({ risk: "Permission Denied", color: "#f44336" });
    });
  }, []);

  // 2. Handle Image Upload
  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null); // Reset result on new file
    }
  };

  const uploadAndDetect = async () => {
    if (!file) return alert("Select a photo first!");
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/predict-insect', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Server Error");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Error connecting to server. Make sure backend is running on localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  // 3. Voice Logic (Web Speech API)
  const speakAdvice = () => {
    if (!result) return;
    const utterance = new SpeechSynthesisUtterance(result[`voice_text_${lang}`]);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'mr-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Agrisentry AI 🛡️</h1>

      {/* Language Toggle */}
      <div style={styles.langToggle}>
        <button onClick={() => setLang('hi')} style={{ ...styles.btn, backgroundColor: lang === 'hi' ? '#1b5e20' : '#4caf50', width: 'auto' }}>हिन्दी</button>
        <button onClick={() => setLang('mr')} style={{ ...styles.btn, backgroundColor: lang === 'mr' ? '#1b5e20' : '#4caf50', width: 'auto' }}>मराठी</button>
      </div>

      {/* Risk Alert Banner */}
      <div style={styles.riskCard(riskData.color)}>
        PEST OUTBREAK RISK: {riskData.risk.toUpperCase()}
      </div>

      {/* Upload Section */}
      <div style={styles.uploadBox} onClick={() => document.getElementById('imageInput').click()}>
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '10px' }} />
        ) : (
          <p>Tap to Capture Pest Image <br/>📸</p>
        )}
        <input id="imageInput" type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
      </div>

      <button style={styles.btn} onClick={uploadAndDetect} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>

      {/* Result Display */}
      {result && (
        <div style={{ ...styles.resultCard, marginTop: '20px' }}>
          <h2 style={{ color: result.category === 'HARMFUL' ? '#f44336' : '#4caf50', marginTop: 0 }}>
            {result.insect_name}
          </h2>
            <p><strong>Status:</strong> {result.category}</p>
            <p><strong>Detection Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
            {result.accuracy && <p><strong>Forecast Accuracy:</strong> {result.accuracy}</p>}
            <hr />
          <p><strong>Recommendation:</strong><br/> {result.recommendation}</p>
          
          <button style={{ ...styles.btn, ...styles.voiceBtn }} onClick={speakAdvice}>
            🔊 Listen Advice ({lang === 'hi' ? 'सुनिए' : 'ऐका'})
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '30px' }}>
        Designed for Indian Farmers • Offline Enabled
      </p>
    </div>
  );
}

export default App;
