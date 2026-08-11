# ⚙️ BACKEND API (FastAPI)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uvicorn
import os
from gtts import gTTS
import io

# Import our ML model
try:
    from models.ai_engine import PestRiskModel
except ImportError:
    # Fallback for direct script execution
    import sys
    sys.path.append("..")
    from models.ai_engine import PestRiskModel

app = FastAPI(title="Agrisentry AI Backend")

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys (Should use env variables in production)
OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE"
risk_engine = PestRiskModel()

class LocationData(BaseModel):
    lat: float
    lon: float

# --- 1. Weather Integration & Risk Prediction ---
@app.post("/predict-risk")
async def predict_risk(loc: LocationData):
    # Fetch real weather
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={loc.lat}&lon={loc.lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    
    try:
        weather_res = requests.get(url).json()
        temp = weather_res['main']['temp']
        humidity = weather_res['main']['humidity']
        # Default rainfall to 0 if not present in API result
        rainfall = weather_res.get('rain', {}).get('1h', 0)
        month = 6 # Can be dynamic
        
        prediction_result = risk_engine.predict(temp, humidity, rainfall, month)
        risk = prediction_result['risk']
        accuracy = prediction_result['accuracy']
        
        return {
            "risk": risk,
            "accuracy": f"{accuracy}%",
            "temp": temp,
            "humidity": humidity,
            "location": weather_res['name'],
            "message": f"Risk is {risk} (Model Confidence: {accuracy}%). Take appropriate measures."
        }
    except Exception as e:
        # Static Fallback for Demo without API Key
        return {
            "risk": "Medium",
            "temp": 28.5,
            "humidity": 65,
            "location": "Pune, India",
            "message": "Demo Mode: Check API Key."
        }

# --- 2. Pest Detection (Mock for MVP) ---
@app.post("/predict-insect")
async def predict_insect(file: UploadFile = File(...)):
    # In a real app: 
    # 1. Save file 2. Use YOLO model 3. Return results
    
    # Mock Response for Hackathon Demonstration
    return {
        "insect_name": "Brown Plant Hopper",
        "category": "HARMFUL",
        "scientific_name": "Nilaparvata lugens",
        "confidence": 0.92,
        "recommendation": "Use Azadirachtin (Neem Oil) or Pymetrozine 50% WG.",
        "voice_text_hi": "यह एक भूरा पौधा फुदका है। यह फसल के लिए हानिकारक है। नीम के तेल का प्रयोग करें।",
        "voice_text_mr": "हा एक तपकिरी तुडतुडा आहे. तो पिकासाठी हानिकारक आहे. निंबोळी अर्काचा वापर करा."
    }

# --- 3. Database Sample Schema (MongoDB Representation) ---
"""
DB: agrisentry_db
Collections:
1. users: { _id, name, phone, state }
2. detections: { _id, user_id, insect, lat, lon, timestamp, image_url }
3. pesticides: { _id, target_pest, name, dosage, safety_period }
"""

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# [Weather] Real-time OpenWeatherMap API query handler

# [API] /predict-risk calculates probability distribution

# [Resilience] Static fallback dataset when weather endpoint is unreachable
