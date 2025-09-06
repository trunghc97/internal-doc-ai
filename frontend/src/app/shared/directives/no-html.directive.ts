import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { HtmlValidator } from '../validators';

@Directive({
  selector: 'input[noHtml], textarea[noHtml]',
  standalone: true
})
export class NoHtmlDirective {
  @Input() noHtml: boolean = true;
  @Input() sanitizeOnInput: boolean = false; // Tự động sanitize thay vì reject

  constructor(
    private el: ElementRef,
    private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (!this.noHtml) return;

    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = input.value;

    if (HtmlValidator.containsHtml(value)) {
      if (this.sanitizeOnInput) {
        // Auto-sanitize: remove HTML tags
        const sanitized = HtmlValidator.sanitizeHtml(value);
        input.value = sanitized;
        
        // Update form control value
        if (this.control && this.control.control) {
          this.control.control.setValue(sanitized);
        }
      } else {
        // Add visual feedback
        this.el.nativeElement.classList.add('border-red-300');
        this.showTooltip('Không được phép nhập thẻ HTML');
      }
    } else {
      // Remove error styling
      this.el.nativeElement.classList.remove('border-red-300');
      this.hideTooltip();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.noHtml) return;

    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    if (HtmlValidator.containsHtml(pastedText)) {
      if (this.sanitizeOnInput) {
        // Prevent default paste and insert sanitized content
        event.preventDefault();
        const sanitized = HtmlValidator.sanitizeHtml(pastedText);
        
        const input = this.el.nativeElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        
        // Insert sanitized text at cursor position
        const newValue = currentValue.slice(0, start) + sanitized + currentValue.slice(end);
        input.value = newValue;
        
        // Update form control
        if (this.control && this.control.control) {
          this.control.control.setValue(newValue);
        }
        
        // Set cursor position after inserted text
        input.setSelectionRange(start + sanitized.length, start + sanitized.length);
      } else {
        // Prevent paste and show warning
        event.preventDefault();
        this.showTooltip('Không thể dán nội dung chứa thẻ HTML');
      }
    }
  }

  private showTooltip(message: string): void {
    // Remove existing tooltip
    this.hideTooltip();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-red-600 rounded shadow-lg';
    tooltip.textContent = message;
    tooltip.id = 'html-validation-tooltip';

    // Position tooltip
    const rect = this.el.nativeElement.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(tooltip);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideTooltip();
    }, 3000);
  }

  private hideTooltip(): void {
    const existingTooltip = document.getElementById('html-validation-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }
}
