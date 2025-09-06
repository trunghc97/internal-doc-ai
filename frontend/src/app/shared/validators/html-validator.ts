import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator để ngăn chặn HTML tags trong input
 */
export class HtmlValidator {
  
  /**
   * Validator function để kiểm tra HTML tags
   * @param control - Form control cần validate
   * @returns ValidationErrors hoặc null
   */
  static noHtml(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Không validate nếu giá trị rỗng
    }

    const value = control.value.toString();
    
    // Regex để phát hiện HTML tags
    const htmlTagRegex = /<[^>]*>/g;
    
    // Kiểm tra có chứa HTML tags không
    if (htmlTagRegex.test(value)) {
      return { htmlNotAllowed: true };
    }

    return null;
  }

  /**
   * Validator function với custom error message
   * @param errorMessage - Custom error message
   * @returns ValidatorFn
   */
  static noHtmlWithMessage(errorMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString();
      const htmlTagRegex = /<[^>]*>/g;
      
      if (htmlTagRegex.test(value)) {
        return { 
          htmlNotAllowed: true,
          message: errorMessage || 'Không được phép nhập thẻ HTML'
        };
      }

      return null;
    };
  }

  /**
   * Validator nghiêm ngặt hơn - kiểm tra cả HTML entities và script
   * @param control - Form control cần validate
   * @returns ValidationErrors hoặc null
   */
  static strictNoHtml(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();
    
    // Regex patterns để phát hiện:
    // 1. HTML tags: <tag>
    // 2. HTML entities: &entity;
    // 3. Script patterns: javascript:, data:, vbscript:
    const htmlTagRegex = /<[^>]*>/g;
    const htmlEntityRegex = /&[a-zA-Z][a-zA-Z0-9]*;/g;
    const scriptRegex = /(javascript|data|vbscript):/gi;
    const onEventRegex = /\bon\w+\s*=/gi; // onclick, onload, etc.

    if (htmlTagRegex.test(value)) {
      return { htmlTagNotAllowed: true };
    }

    if (htmlEntityRegex.test(value)) {
      return { htmlEntityNotAllowed: true };
    }

    if (scriptRegex.test(value)) {
      return { scriptNotAllowed: true };
    }

    if (onEventRegex.test(value)) {
      return { eventHandlerNotAllowed: true };
    }

    return null;
  }

  /**
   * Sanitize input - loại bỏ HTML tags thay vì reject
   * @param value - Giá trị cần sanitize
   * @returns Giá trị đã được sanitize
   */
  static sanitizeHtml(value: string): string {
    if (!value) return value;
    
    // Loại bỏ HTML tags
    let sanitized = value.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities về text thường
    const textArea = document.createElement('textarea');
    textArea.innerHTML = sanitized;
    sanitized = textArea.value;
    
    return sanitized;
  }

  /**
   * Kiểm tra xem có phải là HTML content không
   * @param value - Giá trị cần kiểm tra
   * @returns true nếu chứa HTML
   */
  static containsHtml(value: string): boolean {
    if (!value) return false;
    
    const htmlTagRegex = /<[^>]*>/g;
    return htmlTagRegex.test(value);
  }

  /**
   * Validator cho phép một số thẻ HTML an toàn
   * @param allowedTags - Mảng các thẻ được phép (ví dụ: ['b', 'i', 'strong'])
   * @returns ValidatorFn
   */
  static allowedHtmlTags(allowedTags: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString();
      const htmlTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
      
      let match;
      const foundTags: string[] = [];
      
      while ((match = htmlTagRegex.exec(value)) !== null) {
        const tagName = match[1].toLowerCase();
        if (!allowedTags.includes(tagName)) {
          foundTags.push(tagName);
        }
      }

      if (foundTags.length > 0) {
        return { 
          disallowedHtmlTags: true,
          disallowedTags: foundTags
        };
      }

      return null;
    };
  }
}
