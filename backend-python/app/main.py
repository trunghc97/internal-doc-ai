from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from docx import Document
import re
from typing import List, Dict, Any
import os
from pydantic import BaseModel
import asyncio
from pathlib import Path
from .services.data_classifier import classify_sensitive_data, get_data_category

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

def find_sensitive_info(text: str) -> Dict[str, Any]:
    """Find sensitive information in text using both regex patterns and AI classification"""
    
    # Tìm thông tin nhạy cảm bằng regex patterns (phương pháp cũ)
    regex_results = []
    for info_type, pattern in PATTERNS.items():
        matches = re.finditer(pattern, text)
        for match in matches:
            regex_results.append({
                "type": info_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end(),
                "detection_method": "regex"
            })
    
    # Phân loại dữ liệu bằng AI classifier (phương pháp mới)
    classification_result = classify_sensitive_data(text)
    
    return {
        "regex_detection": regex_results,
        "ai_classification": classification_result,
        "summary": {
            "total_regex_matches": len(regex_results),
            "ai_categories": list(classification_result["categories"]),
            "detected_types": classification_result["detected_types"]
        }
    }

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
        detection_result = find_sensitive_info(text)
        
        return {
            "detection_result": detection_result,
            # Giữ lại format cũ để tương thích
            "sensitive_info": detection_result["regex_detection"]
        }

    except Exception as e:
        # Clean up temp file in case of error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

async def test_detect_with_sample_file():
    """
    Hàm test để giả lập việc gọi detect_sensitive_info với file PDF mẫu
    """
    try:
        # Đường dẫn tới file PDF mẫu
        sample_file_path = Path(__file__).parent.parent / "files" / "Dữ liệu giả 1.pdf"
        # sample_file_path = Path(__file__).parent.parent / "files" / "Dữ liệu giả 5.docx"
        
        if not sample_file_path.exists():
            print(f"⚠️ File mẫu không tồn tại: {sample_file_path}")
            return
        
        print(f"🧪 Bắt đầu test với file: {sample_file_path}")
        
        text = extract_text_from_pdf(str(sample_file_path))
        print(f"📄 Đã extract text từ file, độ dài: {len(text)} ký tự")

        print(f"📄 Đã extract text từ file: {text}")
        
        # Tìm thông tin nhạy cảm
        detection_result = find_sensitive_info(text)
        
        print(f"🔍 Kết quả phát hiện:")
        print(f"   📊 Tóm tắt:")
        print(f"     - Regex matches: {detection_result['summary']['total_regex_matches']}")
        print(f"     - AI categories: {', '.join(detection_result['summary']['ai_categories'])}")
        print(f"     - Detected types: {len(detection_result['summary']['detected_types'])}")
        
        # Hiển thị kết quả regex
        regex_results = detection_result["regex_detection"]
        if regex_results:
            print(f"   🎯 Chi tiết Regex Detection ({len(regex_results)} matches):")
            for info in regex_results:
                print(f"     • {info['type']}: {info['value']} (vị trí: {info['start']}-{info['end']})")
        
        # Hiển thị kết quả AI classification
        ai_result = detection_result["ai_classification"]
        if ai_result["details"]:
            print(f"   🤖 Chi tiết AI Classification:")
            for detail in ai_result["details"]:
                print(f"     • {detail['type']}")
                print(f"       Categories: {', '.join(detail['categories'])}")
                print(f"       Matches: {', '.join(detail['matches'])}")
        else:
            print("   🤖 AI Classification: Không phát hiện loại dữ liệu nhạy cảm nào")
        
        print("✅ Test hoàn thành thành công!")
        
    except Exception as e:
        print(f"❌ Lỗi trong quá trình test: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Event được gọi khi ứng dụng khởi động"""
    print("🚀 Ứng dụng Document AI đang khởi động...")
    
    # Chạy test với file mẫu
    await test_detect_with_sample_file()
    
    print("✨ Ứng dụng đã sẵn sàng!")

class TextRequest(BaseModel):
    text: str

@app.post("/classify-text")
async def classify_text_endpoint(request: TextRequest):
    """
    Endpoint để phân loại dữ liệu nhạy cảm từ text trực tiếp
    """
    text = request.text
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text không được để trống")
    
    try:
        # Phân loại bằng AI classifier
        classification_result = classify_sensitive_data(text)
        simple_category = get_data_category(text)
        
        return {
            "input_text": text,
            "simple_classification": simple_category,
            "detailed_classification": classification_result,
            "summary": {
                "categories": list(classification_result["categories"]),
                "detected_types_count": len(classification_result["detected_types"]),
                "is_sensitive": simple_category != "Không phân loại"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân loại: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/categories")
def get_all_categories():
    """Endpoint để lấy danh sách tất cả các loại dữ liệu nhạy cảm"""
    from .services.data_classifier import classifier
    return {
        "categories": classifier.list_all_categories(),
        "total_types": len(classifier.data_types)
    }
