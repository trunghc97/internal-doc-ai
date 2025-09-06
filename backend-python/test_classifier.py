#!/usr/bin/env python3
"""
Test script để demo module phân loại dữ liệu nhạy cảm
"""

from app.services.data_classifier import classify_sensitive_data, get_data_category

def main():
    print("=== DEMO MODULE PHÂN LOẠI DỮ LIỆU NHẠY CẢM ===\n")
    
    # Test cases đa dạng
    test_cases = [
        {
            "name": "Thông tin chính trị",
            "text": "Ông A là đảng viên và có quan điểm chính trị rõ ràng về vấn đề kinh tế"
        },
        {
            "name": "Thông tin y tế", 
            "text": "Hồ sơ bệnh án cho thấy bệnh nhân bị tiểu đường type 2 và cần điều trị thuốc"
        },
        {
            "name": "Thông tin dân tộc",
            "text": "Anh ấy thuộc dân tộc Tày, sinh sống ở vùng núi phía Bắc"
        },
        {
            "name": "API Keys",
            "text": "Secret key: sk-1234567890abcdef và API key của hệ thống là abc123xyz"
        },
        {
            "name": "Mật khẩu",
            "text": "Mật khẩu của tài khoản admin là: SuperSecret123!"
        },
        {
            "name": "Thông tin vị trí",
            "text": "Tọa độ GPS hiện tại: 21.0285, 105.8542 - định vị tại Hà Nội"
        },
        {
            "name": "Thông tin ngân hàng",
            "text": "Tài khoản ngân hàng Vietcombank với số tiền gửi 500 triệu"
        },
        {
            "name": "Thông tin bình thường",
            "text": "Hôm nay trời đẹp, tôi đi làm và ăn trưa với đồng nghiệp"
        },
        {
            "name": "Kết hợp nhiều loại",
            "text": "Bệnh nhân dân tộc Kinh, mật khẩu: pass123, có tài khoản ngân hàng và quan điểm tôn giáo Phật giáo"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"🧪 Test {i}: {test_case['name']}")
        print(f"📝 Text: {test_case['text']}")
        
        # Phân loại chi tiết
        result = classify_sensitive_data(test_case['text'])
        print(f"🔍 Categories: {', '.join(result['categories'])}")
        
        # Phân loại đơn giản
        simple_category = get_data_category(test_case['text'])
        print(f"📊 Simple classification: {simple_category}")
        
        # Chi tiết phát hiện
        if result['details']:
            print("📋 Chi tiết:")
            for detail in result['details']:
                print(f"   • {detail['type']}")
                print(f"     Loại: {', '.join(detail['categories'])}")
                print(f"     Phát hiện: {', '.join(detail['matches'])}")
        else:
            print("📋 Không phát hiện dữ liệu nhạy cảm")
            
        print("=" * 80)
    
    print("\n🎯 TỔNG KẾT:")
    print("Module phân loại có thể nhận diện:")
    print("✅ 9 loại dữ liệu cá nhân nhạy cảm (theo NĐ 13/2023/NĐ-CP)")
    print("✅ 2 loại dữ liệu nội bộ nhạy cảm")
    print("✅ Kết hợp keywords và regex patterns")
    print("✅ Phân loại đa cấp và chi tiết matches")

if __name__ == "__main__":
    main()
