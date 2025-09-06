from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from .controllers.detection_controller import detection_controller

app = FastAPI(title="Document AI - Sensitive Info Detection")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect")
async def detect_sensitive_info(file: UploadFile = File(...)):
    """
    Detect sensitive information in PDF or DOCX files
    """
    return await detection_controller.detect_sensitive_info(file)

@app.on_event("startup")
async def startup_event():
    """Event được gọi khi ứng dụng khởi động"""
    print("🚀 Ứng dụng Document AI đang khởi động...")
    
    # Chạy test với file mẫu
    await detection_controller.test_detect_with_sample_file()
    
    print("✨ Ứng dụng đã sẵn sàng!")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
