from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from docx import Document
import re
from typing import List, Dict, Any
import os
from pydantic import BaseModel

app = FastAPI(title="Document AI - Sensitive Info Detection")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Regex patterns for sensitive information
PATTERNS = {
    "CMND/CCCD": r"\b\d{9}(?!\d)|\b\d{12}(?!\d)",  # 9 hoặc 12 số
    "MST": r"\b\d{10}(?!\d)|\b\d{13}(?!\d)",  # 10 hoặc 13 số
    "Bank Account": r"\b\d{8,16}(?!\d)",  # 8-16 số
    "Email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "Phone": r"(?:\b0|\+84)\d{9,10}\b",  # Số điện thoại VN
    "Enterprise Tax Code": r"\b\d{10}-\d{3}\b",  # Mã số thuế doanh nghiệp: 10 số - 3 số
    "Credit Card": r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b",  # Các loại thẻ phổ biến
    "Social Insurance": r"\b\d{10,13}(?!\d)",  # Số BHXH: 10-13 số
}

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file using python-docx"""
    try:
        doc = Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from DOCX: {str(e)}")

def find_sensitive_info(text: str) -> List[Dict[str, Any]]:
    """Find sensitive information in text using regex patterns"""
    sensitive_info = []
    
    for info_type, pattern in PATTERNS.items():
        matches = re.finditer(pattern, text)
        for match in matches:
            sensitive_info.append({
                "type": info_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end()
            })
    
    return sensitive_info

@app.post("/detect")
async def detect_sensitive_info(file: UploadFile = File(...)):
    """
    Detect sensitive information in PDF or DOCX files
    """
    # Check file type
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    try:
        # Create temp directory if not exists
        os.makedirs("temp", exist_ok=True)
        
        # Save uploaded file
        file_path = f"temp/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text based on file type
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf(file_path)
        else:
            text = extract_text_from_docx(file_path)
        
        # Clean up temp file
        os.remove(file_path)
        
        # Find sensitive information
        sensitive_info = find_sensitive_info(text)
        
        return {"sensitive_info": sensitive_info}

    except Exception as e:
        # Clean up temp file in case of error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
