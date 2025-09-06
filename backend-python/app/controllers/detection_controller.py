"""
Controller cho API endpoints phát hiện thông tin nhạy cảm
"""

import os
from fastapi import UploadFile, File, HTTPException
from pathlib import Path
from ..services.detection_service import detection_service

class DetectionController:
    """Controller cho detection endpoints"""
    
    def __init__(self):
        self.detection_service = detection_service
    
    async def detect_sensitive_info(self, file: UploadFile = File(...)):
        """
        Detect sensitive information in PDF or DOCX files
        """
        file_path = None
        
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
            
            # Analyze document
            result = self.detection_service.analyze_document(
                file_path=file_path,
                filename=file.filename,
                mime_type=file.content_type,
                file_size=len(content)
            )
            
            # Clean up temp file
            os.remove(file_path)
            file_path = None
            
            return result

        except Exception as e:
            # Clean up temp file in case of error
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=str(e))
    
    async def test_detect_with_sample_file(self):
        """
        Test detection với file PDF mẫu
        """
        try:
            # Đường dẫn tới file PDF mẫu
            sample_file_path = Path(__file__).parent.parent.parent / "files" / "Dữ liệu giả 1.pdf"
            
            if not sample_file_path.exists():
                print(f"⚠️ File mẫu không tồn tại: {sample_file_path}")
                return
            
            print(f"🧪 Bắt đầu test với file: {sample_file_path}")
            
            # Extract text từ PDF
            content_text = self.detection_service.extract_text_from_pdf(str(sample_file_path))
            print(f"📄 Đã extract text từ file, độ dài: {len(content_text)} ký tự")
            print(f"📄 Đã extract text từ file, {content_text}")
            
            # Detect sensitive information using new rules
            matches = self.detection_service.detect_sensitive_by_rules(content_text)
            
            # Print test results
            print("=" * 60)
            print("🧪 TEST SENSITIVE DATA DETECTION")
            print("=" * 60)
            print(f"📁 File: {sample_file_path.name}")
            print(f"📝 Content Length: {len(content_text)} characters")
            print(f"🎯 Total Matches: {len(matches)}")
            print()
            
            if matches:
                print("🔎 DETECTED SENSITIVE DATA:")
                categories = {}
                for match in matches:
                    category = match["category"]
                    if category not in categories:
                        categories[category] = []
                    categories[category].append(match)
                
                for category, cat_matches in categories.items():
                    print(f"\n📂 {category} ({len(cat_matches)} matches):")
                    for i, match in enumerate(cat_matches, 1):
                        # Tìm line number và column của match
                        line_num, col_num, line_content = self.detection_service._find_line_and_column(content_text, match['start'])
                        
                        print(f"  {i}. {match['subtype']}: {match['value']} ({match['method']})")
                        print(f"     Position: {match['start']}-{match['end']} (Line {line_num}, Col {col_num})")
                        if 'keyword_found' in match:
                            print(f"     Keyword Found: {match['keyword_found']}")
                        print(f"     Line Content: {line_content.strip()}")
                        print()
            else:
                print("✅ No sensitive data detected")
            
            print("=" * 60)
            print("✅ Test hoàn thành thành công!")
            
        except Exception as e:
            print(f"❌ Lỗi trong quá trình test: {str(e)}")

# Khởi tạo controller instance
detection_controller = DetectionController()
