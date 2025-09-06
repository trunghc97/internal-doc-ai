from enum import Enum
from typing import List, Optional, Dict, Set
import re

class DataCategory(Enum):
    """Enum định nghĩa các loại dữ liệu nhạy cảm"""
    PERSONAL_SENSITIVE = "Dữ liệu cá nhân nhạy cảm"
    INTERNAL_SENSITIVE = "Dữ liệu nội bộ nhạy cảm" 
    NOT_CLASSIFIED = "Không phân loại"

class SensitiveDataType:
    """Class định nghĩa loại dữ liệu nhạy cảm với keywords và patterns"""
    
    def __init__(self, 
                 name: str, 
                 categories: List[DataCategory], 
                 keywords: List[str] = None, 
                 patterns: List[str] = None,
                 description: str = ""):
        self.name = name
        self.categories = categories
        self.keywords = keywords or []
        self.patterns = patterns or []
        self.description = description

# Định nghĩa các loại dữ liệu nhạy cảm theo bảng phân loại
SENSITIVE_DATA_TYPES = [
    # Dữ liệu cá nhân nhạy cảm (theo NĐ 13/2023/NĐ-CP)
    SensitiveDataType(
        name="Quan điểm chính trị, tôn giáo",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["chính trị", "tôn giáo", "đảng", "tín ngưỡng", "phật giáo", "công giáo", "hồi giáo", "quan điểm chính trị"],
        description="STT 1: Quan điểm chính trị, quan điểm tôn giáo"
    ),
    
    SensitiveDataType(
        name="Thông tin sức khỏe và bệnh án",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["bệnh án", "sức khỏe", "bệnh viện", "khám bệnh", "điều trị", "thuốc", "bệnh tật", "y tế", "bác sĩ"],
        patterns=[r"\b(bệnh án|hồ sơ bệnh án|tình trạng sức khỏe)\b"],
        description="STT 2: Tình trạng sức khỏe và đời tư trong hồ sơ bệnh án"
    ),
    
    SensitiveDataType(
        name="Nguồn gốc chủng tộc, dân tộc",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["chủng tộc", "dân tộc", "kinh", "tày", "thái", "mường", "khmer", "hoa", "nùng", "hmông"],
        patterns=[r"\b(dân tộc|chủng tộc|nguồn gốc)\s*(kinh|tày|thái|mường|khmer|hoa|nùng|hmông)\b"],
        description="STT 3: Thông tin liên quan đến nguồn gốc chủng tộc, dân tộc"
    ),
    
    SensitiveDataType(
        name="Đặc điểm di truyền",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["di truyền", "gen", "adn", "dna", "nhiễm sắc thể", "gen di truyền", "đặc điểm di truyền"],
        patterns=[r"\b(gen|dna|adn|di truyền|nhiễm sắc thể)\b"],
        description="STT 4: Thông tin về đặc điểm di truyền"
    ),
    
    SensitiveDataType(
        name="Thuộc tính vật lý, sinh học",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["vân tay", "võng mạc", "khuôn mặt", "giọng nói", "sinh trắc học", "nhận dạng sinh học"],
        patterns=[r"\b(vân tay|võng mạc|sinh trắc|nhận dạng sinh học)\b"],
        description="STT 5: Thông tin về thuộc tính vật lý, đặc điểm sinh học"
    ),
    
    SensitiveDataType(
        name="Đời sống tình dục",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["tình dục", "xu hướng tình dục", "giới tính", "lgbt", "đồng tính", "dị tính"],
        patterns=[r"\b(xu hướng tình dục|đời sống tình dục)\b"],
        description="STT 6: Thông tin về đời sống tình dục, xu hướng tình dục"
    ),
    
    SensitiveDataType(
        name="Dữ liệu tội phạm",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["tội phạm", "phạm tội", "án tù", "tiền án", "tiền sự", "vi phạm pháp luật"],
        patterns=[r"\b(tội phạm|phạm tội|tiền án|tiền sự)\b"],
        description="STT 7: Dữ liệu về tội phạm, hành vi phạm tội"
    ),
    
    SensitiveDataType(
        name="Thông tin ngân hàng khách hàng",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["tài khoản ngân hàng", "tiền gửi", "giao dịch ngân hàng", "bảo đảm ngân hàng", "tín dụng"],
        patterns=[r"\b(tài khoản|tiền gửi|giao dịch|tín dụng)\s*(ngân hàng|bank)\b"],
        description="STT 8: Thông tin khách hàng tổ chức tín dụng"
    ),
    
    SensitiveDataType(
        name="Dữ liệu vị trí",
        categories=[DataCategory.PERSONAL_SENSITIVE],
        keywords=["vị trí", "định vị", "gps", "tọa độ", "địa điểm", "location"],
        patterns=[r"\b(gps|định vị|tọa độ|location)\b", r"\d+\.\d+,\s*\d+\.\d+"],
        description="STT 9: Dữ liệu về vị trí cá nhân qua dịch vụ định vị"
    ),
    
    # Dữ liệu nội bộ nhạy cảm
    SensitiveDataType(
        name="Secret Keys và Tokens",
        categories=[DataCategory.INTERNAL_SENSITIVE],
        keywords=["secret key", "api key", "access token", "session token", "private key", "auth token"],
        patterns=[
            r"\b(secret[_\s]?key|api[_\s]?key|access[_\s]?token|session[_\s]?token)\b",
            r"sk-[a-zA-Z0-9]{48}",  # OpenAI API key pattern
            r"Bearer\s+[a-zA-Z0-9\-_=]+",  # Bearer token
            r"[a-zA-Z0-9]{32,}",  # Generic long alphanumeric strings
        ],
        description="STT 10: Secret Key, API Key, Access Token, session token"
    ),
    
    SensitiveDataType(
        name="Mật khẩu người dùng",
        categories=[DataCategory.INTERNAL_SENSITIVE],
        keywords=["password", "mật khẩu", "pass", "pwd", "secret"],
        patterns=[r"\b(password|mật khẩu|pass|pwd)\s*[:=]\s*\S+"],
        description="STT 11: Mã khóa bí mật người dùng (Password)"
    ),
]

class DataClassifier:
    """Class chính để phân loại dữ liệu nhạy cảm"""
    
    def __init__(self):
        self.data_types = SENSITIVE_DATA_TYPES
        # Tạo index để tìm kiếm nhanh
        self._build_keyword_index()
    
    def _build_keyword_index(self):
        """Xây dựng index keywords để tìm kiếm nhanh"""
        self.keyword_to_types: Dict[str, List[SensitiveDataType]] = {}
        
        for data_type in self.data_types:
            for keyword in data_type.keywords:
                if keyword.lower() not in self.keyword_to_types:
                    self.keyword_to_types[keyword.lower()] = []
                self.keyword_to_types[keyword.lower()].append(data_type)
    
    def classify_sensitive_data(self, text: str) -> Dict[str, any]:
        """
        Phân loại dữ liệu nhạy cảm từ text đầu vào
        
        Args:
            text (str): Văn bản cần phân loại
            
        Returns:
            Dict với thông tin phân loại:
            - categories: Set các loại dữ liệu nhạy cảm
            - detected_types: List các loại dữ liệu được phát hiện
            - details: Chi tiết về từng loại được phát hiện
        """
        if not text or not isinstance(text, str):
            return {
                "categories": {DataCategory.NOT_CLASSIFIED.value},
                "detected_types": [],
                "details": []
            }
        
        text_lower = text.lower()
        detected_types = []
        categories = set()
        details = []
        
        for data_type in self.data_types:
            matches = self._check_data_type_match(text_lower, data_type)
            if matches:
                detected_types.append(data_type.name)
                categories.update([cat.value for cat in data_type.categories])
                details.append({
                    "type": data_type.name,
                    "categories": [cat.value for cat in data_type.categories],
                    "matches": matches,
                    "description": data_type.description
                })
        
        if not categories:
            categories.add(DataCategory.NOT_CLASSIFIED.value)
        
        return {
            "categories": categories,
            "detected_types": detected_types,
            "details": details
        }
    
    def _check_data_type_match(self, text_lower: str, data_type: SensitiveDataType) -> List[str]:
        """Kiểm tra xem text có khớp với loại dữ liệu không"""
        matches = []
        
        # Kiểm tra keywords
        for keyword in data_type.keywords:
            if keyword.lower() in text_lower:
                matches.append(f"Keyword: {keyword}")
        
        # Kiểm tra patterns
        for pattern in data_type.patterns:
            try:
                regex_matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in regex_matches:
                    matches.append(f"Pattern: {match.group()}")
            except re.error:
                continue  # Bỏ qua pattern không hợp lệ
        
        return matches
    
    def get_category_summary(self, text: str) -> str:
        """
        Trả về tóm tắt phân loại đơn giản
        
        Args:
            text (str): Văn bản cần phân loại
            
        Returns:
            str: Loại phân loại chính hoặc "Không phân loại"
        """
        result = self.classify_sensitive_data(text)
        categories = result["categories"]
        
        if DataCategory.NOT_CLASSIFIED.value in categories:
            return DataCategory.NOT_CLASSIFIED.value
        
        # Nếu có cả hai loại
        if (DataCategory.PERSONAL_SENSITIVE.value in categories and 
            DataCategory.INTERNAL_SENSITIVE.value in categories):
            return f"{DataCategory.PERSONAL_SENSITIVE.value}, {DataCategory.INTERNAL_SENSITIVE.value}"
        
        # Trả về loại đầu tiên tìm thấy
        return list(categories)[0]
    
    def list_all_categories(self) -> Dict[str, List[str]]:
        """Liệt kê tất cả các loại dữ liệu theo category"""
        result = {
            DataCategory.PERSONAL_SENSITIVE.value: [],
            DataCategory.INTERNAL_SENSITIVE.value: []
        }
        
        for data_type in self.data_types:
            for category in data_type.categories:
                if category.value in result:
                    result[category.value].append(data_type.name)
        
        return result

# Khởi tạo classifier global để sử dụng
classifier = DataClassifier()

def classify_sensitive_data(text: str) -> Dict[str, any]:
    """
    Hàm tiện ích để phân loại dữ liệu nhạy cảm
    
    Args:
        text (str): Văn bản cần phân loại
        
    Returns:
        Dict: Kết quả phân loại chi tiết
    """
    return classifier.classify_sensitive_data(text)

def get_data_category(text: str) -> str:
    """
    Hàm tiện ích để lấy loại phân loại đơn giản
    
    Args:
        text (str): Văn bản cần phân loại
        
    Returns:
        str: Loại phân loại hoặc "Không phân loại"
    """
    return classifier.get_category_summary(text)

# Example usage và test
if __name__ == "__main__":
    # Test cases
    test_cases = [
        "Thông tin về đảng viên và quan điểm chính trị của ông A",
        "Hồ sơ bệnh án của bệnh nhân bị tiểu đường",
        "Anh ấy thuộc dân tộc Tày",
        "API key: sk-1234567890abcdef",
        "Password: mySecretPassword123",
        "Tọa độ GPS: 21.0285, 105.8542",
        "Thông tin về công việc hàng ngày"
    ]
    
    print("=== TEST PHÂN LOẠI DỮ LIỆU NHẠY CẢM ===\n")
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"Test {i}: {test_text}")
        result = classify_sensitive_data(test_text)
        print(f"Phân loại: {', '.join(result['categories'])}")
        if result['details']:
            print("Chi tiết:")
            for detail in result['details']:
                print(f"  - {detail['type']}: {detail['matches']}")
        print("-" * 50)
