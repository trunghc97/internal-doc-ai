"""
Service cho phát hiện thông tin nhạy cảm
"""

import re
from typing import List, Dict, Any
import pdfplumber
from docx import Document
from fastapi import HTTPException

class SensitiveCategory:
    NO_CATEGORY = "Không phân loại"
    INTERNAL = "Dữ liệu nội bộ nhạy cảm"
    IDENTIFIABLE = "Dữ liệu định danh nhạy cảm"

class SubType:
    # Định danh cá nhân
    PHONE = "Số điện thoại"
    ID_CARD = "Số chứng minh nhân dân"
    PERSONAL_ID = "Số định danh cá nhân"
    PASSPORT = "Số hộ chiếu"
    LICENSE = "Số giấy phép lái xe"
    PLATE = "Số biển số xe"
    TAX_ID_PERSONAL = "Số mã số thuế cá nhân"
    SOCIAL_INSURANCE = "Số bảo hiểm xã hội"
    HEALTH_INSURANCE = "Số thẻ bảo hiểm y tế"
    # Định danh tổ chức
    TAX_ID_ORG = "Mã số thuế tổ chức"
    # Nội bộ
    BANK_ACCOUNT = "Số tài khoản ngân hàng"
    SALARY = "Thông tin lương thưởng"
    CARD_NUMBER = "Số thẻ"
    SECRET_KEY = "Secret/API Key/Token"
    PASSWORD = "Mật khẩu"
    UNKNOWN = "Không xác định"

SUBTYPE_DETECT_RULES = [
    # Định danh cá nhân (IDENTIFIABLE)
    {
        "subtype": SubType.PHONE,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "điện thoại", "dien thoai", "đt", "dt", "sdt", "số dt", "so dt", "phone", "tel", "telephone", 
            "mobile", "mobifone", "liên hệ", "lien he", "liên lạc", "lien lac", "hotline", "contact number"
        ],
        "regex": r"(?:\+?84[\s\-\.]?)?0?(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])([\s\-\.]?\d){7,8}\b"
    },
    {
        "subtype": SubType.ID_CARD,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "chứng minh nhân dân", "chung minh nhan dan", "cmnd", "id card", "cmt", "cmnd/cccd", 
            "giấy cmnd", "giay cmnd", "số cmnd", "so cmnd", "identity card"
        ],
        "regex": r"\b(\d[\s\-\.]?){9}\b"
    },
    {
        "subtype": SubType.PERSONAL_ID,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "căn cước công dân", "can cuoc cong dan", "cccd", "cccd/cc", "id ca nhan", 
            "personal id", "citizen id", "mã định danh", "ma dinh danh", "căn cước", "can cuoc", 
            "số cccd", "so cccd", "giấy cccd", "giay cccd"
        ],
        "regex": r"\b(\d[\s\-\.]?){12}\b"
    },
    {
        "subtype": SubType.PASSPORT,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "hộ chiếu", "ho chieu", "passport", "pp", "passport number", "so ho chieu", "số hộ chiếu", 
            "giấy hộ chiếu", "giay ho chieu"
        ],
        "regex": r"\b([A-Z]{1,2}[\s\-\.]?(\d[\s\-\.]?){7})\b"
    },
    {
        "subtype": SubType.LICENSE,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "giấy phép lái xe", "giay phep lai xe", "gplx", "driver license", "driving license", "bằng lái xe", 
            "bang lai xe", "bang lai", "số gplx", "so gplx", "bằng lái", "giấy lái xe", "giay lai xe"
        ],
        "regex": r"\b(\d[\s\-\.]?){12}\b"
    },
    {
        "subtype": SubType.PLATE,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "biển số xe", "bien so xe", "bienso", "license plate", "plate number", "bks", 
            "biển kiểm soát", "bien kiem soat", "số xe", "so xe", "biển số", "bien so"
        ],
        "regex": r"\b\d{2}[A-Z]{1,2}[\s\-\.]?\d{4,5}\b"
    },
    {
        "subtype": SubType.TAX_ID_PERSONAL,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "mã số thuế cá nhân", "ma so thue ca nhan", "mst cá nhân", "mst ca nhan", "tax id", 
            "tax code", "mã số thuế", "ma so thue", "mst", "số mst", "so mst", "số thuế", "so thue"
        ],
        "regex": r"\b(\d[\s\-\.]?){10}(([\s\-\.]?\d){3})?\b"
    },
    {
        "subtype": SubType.SOCIAL_INSURANCE,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "bảo hiểm xã hội", "bao hiem xa hoi", "bhxh", "social insurance", "số bhxh", "so bhxh", 
            "mã bhxh", "ma bhxh"
        ],
        "regex": r"\b(\d[\s\-\.]?){10}\b"
    },
    {
        "subtype": SubType.HEALTH_INSURANCE,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "bảo hiểm y tế", "bao hiem y te", "bhyt", "health insurance", "thẻ bhyt", "the bhyt", 
            "số thẻ bảo hiểm", "so the bao hiem", "số bhyt", "so bhyt", "mã bhyt", "ma bhyt"
        ],
        "regex": r"\b[A-Z]{2}([\s\-\.]?\d){13}\b"
    },
    # Định danh tổ chức (IDENTIFIABLE)
    {
        "subtype": SubType.TAX_ID_ORG,
        "category": SensitiveCategory.IDENTIFIABLE,
        "keywords": [
            "mã số thuế", "ma so thue", "mst tổ chức", "mst to chuc", "tax id org", "tax code org", 
            "mã số thuế doanh nghiệp", "ma so thue doanh nghiep", "mã số thuế cty", "ma so thue cty"
        ],
        "regex": r"\b\d{10}-\d{3}\b"
    },
    # Nội bộ nhạy cảm (INTERNAL)
    {
        "subtype": SubType.BANK_ACCOUNT,
        "category": SensitiveCategory.INTERNAL,
        "keywords": [
            "số tài khoản", "so tai khoan", "stk", "bank account", "tài khoản ngân hàng", "tai khoan ngan hang", 
            "account number", "số tk", "so tk", "tk ngân hàng", "tk ngan hang", "số tài khoản ngân hàng", "so tai khoan ngan hang"
        ],
        "regex": r"\b(\d[\s\-\.]?){8,16}\b"
    },
    {
        "subtype": SubType.CARD_NUMBER,
        "category": SensitiveCategory.INTERNAL,
        "keywords": [
            "số thẻ", "so the", "card number", "credit card", "debit card", "số thẻ tín dụng", 
            "so the tin dung", "số thẻ ngân hàng", "so the ngan hang", "card", "thẻ ngân hàng", "the ngan hang"
        ],
        "regex": r"\b(\d[\s\-\.]?){16}\b"
    },
     {
         "subtype": SubType.SALARY,
         "category": SensitiveCategory.INTERNAL,
         "keywords": [
             "lương", "luong", "bảng lương", "bang luong", "salary", "thưởng", "thuong", "bonus", 
             "thông tin lương thưởng", "thong tin luong thuong", "phiếu lương", "phieu luong", "bảng thưởng", "bang thuong", "bảng lương thưởng", "bang luong thuong", "quyết toán lương", "quyet toan luong", "salary slip", "salary report"
         ],
         "regex": ""  # Không có regex, lấy value mặc định
     },
     {
         "subtype": SubType.SECRET_KEY,
         "category": SensitiveCategory.INTERNAL,
         "keywords": [
             "secret key", "api key", "access token", "session token", "token", "client secret", "private key", 
             "api_token", "api-key", "client_secret", "client-key", "consumer key", "jwt", "oauth token", "oauth", "authorization code", "refresh token"
         ],
         "regex": ""  # Không có regex, lấy value mặc định
     },
     {
         "subtype": SubType.PASSWORD,
         "category": SensitiveCategory.INTERNAL,
         "keywords": [
             "mật khẩu", "mat khau", "password", "pass", "pwd", "mã khóa bí mật", "ma khoa bi mat", 
             "login password", "user password", "admin password", "admin pass", "root password", "passcode"
         ],
         "regex": ""  # Không có regex, lấy value mặc định
     },
]

class DetectionService:
    """Service cho phát hiện thông tin nhạy cảm"""
    
    def __init__(self):
        self.rules = SUBTYPE_DETECT_RULES
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file using pdfplumber"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file using python-docx"""
        try:
            doc = Document(file_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text from DOCX: {str(e)}")
    
    def detect_sensitive_by_rules(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect sensitive information using SUBTYPE_DETECT_RULES
        Ưu tiên keyword, lấy giá trị ngay sau keyword làm value
        """
        matches = []
        text_lower = text.lower()
        
        for rule in self.rules:
            subtype = rule["subtype"]
            category = rule["category"]
            keywords = rule["keywords"]
            regex_pattern = rule["regex"]
            
            # Detect by keywords - ưu tiên và lấy value sau keyword
            keyword_matches = []
            for keyword in keywords:
                keyword_lower = keyword.lower()
                start_pos = 0
                while True:
                    pos = text_lower.find(keyword_lower, start_pos)
                    if pos == -1:
                        break
                    
                    # Tìm giá trị ngay sau keyword
                    keyword_end = pos + len(keyword)
                    value_after_keyword = self._extract_value_after_keyword(text, keyword_end, subtype)
                    
                    if value_after_keyword:
                        # Kiểm tra xem rule có regex không
                        if regex_pattern and regex_pattern.strip():
                            # Có regex: value phải match regex mới được chấp nhận
                            refined_value = self._apply_regex_to_value(value_after_keyword["value"], regex_pattern)
                            
                            if refined_value:
                                # Chỉ thêm khi regex match thành công
                                keyword_matches.append({
                                    "category": category,
                                    "subtype": subtype,
                                    "value": refined_value,
                                    "start": pos,
                                    "end": value_after_keyword["end"],
                                    "method": "keyword+regex",
                                    "keyword_found": keyword
                                })
                            # Nếu regex không match thì bỏ qua, không thêm vào kết quả
                        else:
                            # Không có regex: lấy value mặc định sau keyword
                            keyword_matches.append({
                                "category": category,
                                "subtype": subtype,
                                "value": value_after_keyword["value"],
                                "start": pos,
                                "end": value_after_keyword["end"],
                                "method": "keyword",
                                "keyword_found": keyword
                            })
                    else:
                        # Nếu không tìm thấy value sau keyword, lấy keyword làm value
                        keyword_matches.append({
                            "category": category,
                            "subtype": subtype,
                            "value": text[pos:pos+len(keyword)],
                            "start": pos,
                            "end": pos + len(keyword),
                            "method": "keyword",
                            "keyword_found": keyword
                        })
                    
                    start_pos = pos + 1
            
            # Chỉ thêm keyword matches - bắt buộc phải match keyword trước
            matches.extend(keyword_matches)
        
        return matches
    
    def _extract_value_after_keyword(self, text: str, keyword_end: int, subtype: str) -> Dict[str, Any]:
        """
        Trích xuất giá trị ngay sau keyword
        """
        # Bỏ qua khoảng trắng và dấu phân cách
        separators = [" ", ":", "=", "-", "\t", "\n"]
        start_pos = keyword_end
        
        # Bỏ qua các ký tự phân cách
        while start_pos < len(text) and text[start_pos] in separators:
            start_pos += 1
        
        if start_pos >= len(text):
            return None
        
        # Lấy đoạn text dài hơn để có thể chứa số có dấu cách
        # Lấy tối đa 100 ký tự sau keyword để đảm bảo có đủ dữ liệu
        max_length = min(100, len(text) - start_pos)
        pattern = r"[\w\d\s\-\.]{1," + str(max_length) + "}"
        
        # Tìm value từ vị trí start_pos
        remaining_text = text[start_pos:]
        match = re.match(pattern, remaining_text)
        
        if match:
            value = match.group().strip()
            # Loại bỏ các ký tự không mong muốn ở cuối
            value = re.sub(r'[^\w\d\s\-\.]$', '', value).strip()
            
            if value and len(value) > 0:
                return {
                    "value": value,
                    "start": start_pos,
                    "end": start_pos + len(value)
                }
        
        # Fallback: lấy từ tiếp theo
        words = remaining_text.split()
        if words:
            first_word = words[0]
            # Loại bỏ dấu câu ở cuối
            first_word = re.sub(r'[^\w\d\-\.]', '', first_word)
            if first_word:
                return {
                    "value": first_word,
                    "start": start_pos,
                    "end": start_pos + len(first_word)
                }
        
        return None
    
    def _apply_regex_to_value(self, value: str, regex_pattern: str) -> str:
        """
        Áp dụng regex lên value để làm sạch và chuẩn hóa
        """
        try:
            # Tìm regex match trong value
            match = re.search(regex_pattern, value)
            if match:
                # Trả về phần match và loại bỏ dấu cách thừa
                matched_value = match.group()
                # Chuẩn hóa: loại bỏ dấu cách thừa nhưng giữ lại cấu trúc
                return re.sub(r'\s+', ' ', matched_value).strip()
            return None
        except re.error:
            return None
    
    def process_file(self, file_path: str, mime_type: str) -> str:
        """Process file và extract text dựa trên mime type"""
        if mime_type == "application/pdf":
            return self.extract_text_from_pdf(file_path)
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self.extract_text_from_docx(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    
    def analyze_document(self, file_path: str, filename: str, mime_type: str, file_size: int) -> Dict[str, Any]:
        """Phân tích document hoàn chỉnh"""
        
        # Extract text
        content_text = self.process_file(file_path, mime_type)
        
        # Detect sensitive information
        matches = self.detect_sensitive_by_rules(content_text)
        
        # Log results
        self._log_detection_results(filename, mime_type, content_text, matches, file_size)
        
        return {
            "success": True,
            "filename": filename,
            "mime_type": mime_type,
            "file_size": file_size,
            "content_length": len(content_text),
            "total_matches": len(matches),
            "matches": matches,
            "categories_found": list(set([match["category"] for match in matches])),
            "subtypes_found": list(set([match["subtype"] for match in matches]))
        }
    
    def _log_detection_results(self, filename: str, mime_type: str, content_text: str, matches: List[Dict], file_size: int):
        """Log kết quả detection"""
        
        result_data = {
            "filename": filename,
            "mime_type": mime_type,
            "content_text": content_text[:500] + "..." if len(content_text) > 500 else content_text,
            "matches": matches,
            "file_size": file_size,
            "uploaded_by": "api_user"
        }
        
        print("=" * 80)
        print("🔍 SENSITIVE DATA DETECTION RESULT")
        print("=" * 80)
        print(f"📁 Filename: {result_data['filename']}")
        print(f"📄 MIME Type: {result_data['mime_type']}")
        print(f"📊 File Size: {result_data['file_size']} bytes")
        print(f"👤 Uploaded By: {result_data['uploaded_by']}")
        print(f"📝 Content Length: {len(content_text)} characters")
        print(f"🎯 Total Matches: {len(matches)}")
        print()
        
        if matches:
            print("🔎 DETECTED SENSITIVE DATA:")
            
            # Tách text thành các dòng để tìm line number
            lines = content_text.split('\n')
            
            for i, match in enumerate(matches, 1):
                # Tìm line number và column của match
                line_num, col_num, line_content = self._find_line_and_column(content_text, match['start'])
                
                print(f"  {i}. Category: {match['category']}")
                print(f"     SubType: {match['subtype']}")
                print(f"     Value: {match['value']}")
                print(f"     Position: {match['start']}-{match['end']} (Line {line_num}, Col {col_num})")
                print(f"     Method: {match['method']}")
                if 'keyword_found' in match:
                    print(f"     Keyword Found: {match['keyword_found']}")
                print(f"     Line Content: {line_content.strip()}")
                print()
        else:
            print("✅ No sensitive data detected")
        
        print("=" * 80)
    
    def _find_line_and_column(self, text: str, position: int) -> tuple:
        """
        Tìm line number và column number của position trong text
        Returns: (line_number, column_number, line_content)
        """
        lines = text.split('\n')
        current_pos = 0
        
        for line_num, line in enumerate(lines, 1):
            line_length = len(line) + 1  # +1 cho ký tự newline
            
            if current_pos + line_length > position:
                # Position nằm trong dòng này
                column = position - current_pos + 1
                return line_num, column, line
            
            current_pos += line_length
        
        # Nếu không tìm thấy (trường hợp edge case)
        return len(lines), 1, lines[-1] if lines else ""

# Khởi tạo service instance
detection_service = DetectionService()
