"""
Models để lưu trữ thông tin nhạy cảm được phát hiện
Cập nhật theo database schema hiện có
"""

from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
import uuid

from ..config.database import Base

class DocumentStatus(str, Enum):
    """Enum cho trạng thái document"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"
    ARCHIVED = "ARCHIVED"

class RiskType(str, Enum):
    """Enum cho loại rủi ro"""
    PERSONAL_DATA = "PERSONAL_DATA"
    FINANCIAL_DATA = "FINANCIAL_DATA"
    IDENTITY_DATA = "IDENTITY_DATA"
    CONFIDENTIAL_DATA = "CONFIDENTIAL_DATA"
    AUTHENTICATION_DATA = "AUTHENTICATION_DATA"
    LOCATION_DATA = "LOCATION_DATA"
    HEALTH_DATA = "HEALTH_DATA"
    POLITICAL_DATA = "POLITICAL_DATA"
    CRIMINAL_DATA = "CRIMINAL_DATA"

class User(Base):
    """Model cho users - để reference từ documents"""
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    documents = relationship("Document", back_populates="owner_user")

class Document(Base):
    """
    Model cho documents được phân tích
    Khớp với schema database hiện có
    """
    __tablename__ = "documents"
    
    id = Column(BigInteger, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(255), nullable=False)  # application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
    file_size = Column(BigInteger, nullable=False)  # bytes
    content = Column(Text, nullable=True)  # extracted text content
    
    # Sensitive info và risk assessment
    sensitive_info = Column(Text, nullable=True)  # JSON string chứa thông tin nhạy cảm
    risk_score = Column(Numeric(10), nullable=True)  # điểm rủi ro từ 0-100
    status = Column(Text, nullable=True)  # PENDING, PROCESSING, COMPLETED, ERROR
    
    # Timestamps
    uploaded_at = Column(DateTime(6), nullable=False, server_default=func.now())
    last_modified_at = Column(DateTime(6), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Foreign key
    owner_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner_user = relationship("User", back_populates="documents")
    document_risks = relationship("DocumentRisk", back_populates="document", cascade="all, delete-orphan")

class DocumentRisk(Base):
    """
    Model cho documents_risk
    Lưu trữ các rủi ro cụ thể được phát hiện trong document
    """
    __tablename__ = "documents_risk"
    
    id = Column(BigInteger, primary_key=True, index=True)
    document_id = Column(BigInteger, ForeignKey("documents.id"), nullable=False)
    
    # Risk information
    risk_type = Column(Text, nullable=True)  # Loại rủi ro: PERSONAL_DATA, FINANCIAL_DATA, etc.
    risk_key = Column(Text, nullable=True)   # Key/identifier của rủi ro: email, phone, cccd, etc.
    content = Column(Text, nullable=True)    # Nội dung cụ thể được phát hiện
    
    # Relationships
    document = relationship("Document", back_populates="document_risks")

# Utility classes và functions
class DocumentProcessor:
    """Utility class để xử lý document và tính toán risk"""
    
    @staticmethod
    def calculate_risk_score(sensitive_items: list) -> float:
        """
        Tính toán risk score dựa trên các sensitive items được phát hiện
        
        Args:
            sensitive_items: List các sensitive items từ detection result
            
        Returns:
            float: Risk score từ 0-100
        """
        if not sensitive_items:
            return 0.0
        
        # Risk weights cho các loại dữ liệu
        risk_weights = {
            "CMND/CCCD": 25,
            "MST": 20,
            "Bank Account": 30,
            "Credit Card": 35,
            "Email": 10,
            "Phone": 15,
            "Social Insurance": 20,
            "API Key": 40,
            "Secret Key": 45,
            "Password": 50,
            "Access Token": 35,
        }
        
        total_risk = 0
        for item in sensitive_items:
            item_type = item.get("type", "")
            weight = risk_weights.get(item_type, 10)  # Default weight
            total_risk += weight
        
        # Cap at 100
        return min(total_risk, 100.0)
    
    @staticmethod
    def determine_status(risk_score: float) -> str:
        """Xác định status dựa trên risk score"""
        if risk_score == 0:
            return DocumentStatus.COMPLETED.value
        elif risk_score < 30:
            return DocumentStatus.COMPLETED.value
        elif risk_score < 70:
            return DocumentStatus.COMPLETED.value  # Có risk nhưng đã xử lý xong
        else:
            return DocumentStatus.COMPLETED.value  # High risk nhưng đã phân tích xong
    
    @staticmethod
    def map_detection_to_risk_type(detection_type: str) -> str:
        """Map từ detection type sang risk type"""
        mapping = {
            "CMND/CCCD": RiskType.IDENTITY_DATA.value,
            "MST": RiskType.FINANCIAL_DATA.value,
            "Bank Account": RiskType.FINANCIAL_DATA.value,
            "Credit Card": RiskType.FINANCIAL_DATA.value,
            "Email": RiskType.PERSONAL_DATA.value,
            "Phone": RiskType.PERSONAL_DATA.value,
            "Social Insurance": RiskType.PERSONAL_DATA.value,
            "API Key": RiskType.AUTHENTICATION_DATA.value,
            "Secret Key": RiskType.AUTHENTICATION_DATA.value,
            "Password": RiskType.AUTHENTICATION_DATA.value,
            "Access Token": RiskType.AUTHENTICATION_DATA.value,
        }
        return mapping.get(detection_type, RiskType.CONFIDENTIAL_DATA.value)
    
    @staticmethod
    def create_sensitive_info_json(detection_result: dict) -> str:
        """
        Tạo JSON string cho sensitive_info field
        
        Args:
            detection_result: Kết quả từ find_sensitive_info()
            
        Returns:
            str: JSON string
        """
        import json
        
        # Tạo cấu trúc JSON compact cho sensitive_info
        sensitive_info = {
            "total_items": len(detection_result.get("regex_detection", [])),
            "risk_categories": list(detection_result.get("summary", {}).get("ai_categories", [])),
            "detection_summary": {
                "regex_matches": len(detection_result.get("regex_detection", [])),
                "ai_detections": len(detection_result.get("ai_classification", {}).get("details", []))
            },
            "items": []
        }
        
        # Thêm regex detection items
        for item in detection_result.get("regex_detection", []):
            sensitive_info["items"].append({
                "type": item["type"],
                "value": item["value"][:50] + "..." if len(item["value"]) > 50 else item["value"],  # Truncate long values
                "method": "regex",
                "position": f"{item.get('start', 0)}-{item.get('end', 0)}"
            })
        
        return json.dumps(sensitive_info, ensure_ascii=False)

# Legacy compatibility - giữ lại để không break existing code
class DataCategoryEnum(str, Enum):
    """Enum cho các loại dữ liệu nhạy cảm - legacy compatibility"""
    PERSONAL_SENSITIVE = "Dữ liệu cá nhân nhạy cảm"
    INTERNAL_SENSITIVE = "Dữ liệu nội bộ nhạy cảm"
    NOT_CLASSIFIED = "Không phân loại"

class DetectionMethodEnum(str, Enum):
    """Enum cho phương pháp phát hiện - legacy compatibility"""
    REGEX = "regex"
    AI_CLASSIFICATION = "ai_classification"
    MANUAL = "manual"

# Utility functions
def get_risk_level(risk_score: float) -> str:
    """Tính toán risk level dựa trên risk score"""
    if risk_score == 0:
        return "none"
    elif risk_score <= 25:
        return "low"
    elif risk_score <= 50:
        return "medium"
    elif risk_score <= 75:
        return "high"
    else:
        return "critical"

def generate_unique_id():
    """Tạo unique ID"""
    return str(uuid.uuid4())
