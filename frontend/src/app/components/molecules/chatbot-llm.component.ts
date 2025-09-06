import { Component, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { LlmService, ChatMessage } from '../../services/llm.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chatbot-llm',
  template: `
    <div class="fixed bottom-6 right-6 w-96 z-50" *ngIf="isBubbleMode && !isOpen">
      <button
        (click)="setIsOpen(true)"
        class="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
      >
        <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>

    <div
      class="flex flex-col h-[500px] bg-white rounded-lg shadow-lg {{ isBubbleMode ? 'fixed bottom-6 right-6 w-96' : '' }} z-50"
      *ngIf="!isBubbleMode || isOpen"
    >
      <!-- Chat header -->
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="text-lg font-semibold">Chat với AI Assistant</h3>
        <button
          *ngIf="isBubbleMode"
          (click)="setIsOpen(false)"
          class="text-gray-500 hover:text-gray-700"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Chat messages -->
      <div
        #chatContainer
        class="flex-1 overflow-y-auto p-4 space-y-4"
        (scroll)="onScroll()"
      >
        <div
          *ngFor="let message of messages"
          class="flex"
          [ngClass]="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-lg px-4 py-2"
            [ngClass]="message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'"
          >
            <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
          </div>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="flex justify-start">
          <div class="bg-gray-100 rounded-lg px-4 py-2">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div *ngIf="error" class="px-4 py-2 bg-red-50 border-t border-red-200">
        <p class="text-red-600 text-sm">{{ error }}</p>
      </div>

      <!-- Input area -->
      <form (ngSubmit)="onSubmit()" class="p-4 border-t">
        <div class="flex space-x-2">
          <textarea
            #messageInput
            [(ngModel)]="input"
            name="message"
            placeholder="Nhập tin nhắn..."
            class="flex-1 min-h-[44px] max-h-[120px] p-2 border rounded-lg resize-y"
            [disabled]="isLoading"
            (keydown)="onKeyDown($event)"
          ></textarea>
          <app-button
            type="submit"
            [isLoading]="isLoading"
            [disabled]="!input.trim()"
          >
            Gửi
          </app-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .animate-bounce {
      animation: bounce 1s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
  `]
})
export class ChatbotLlmComponent implements AfterViewChecked {
  @Input() className = '';
  @Input() isBubbleMode = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: Message[] = [];
  input = '';
  isLoading = false;
  error: string | null = null;
  isOpen = false;

  private shouldScrollToBottom = false;

  constructor(private llmService: LlmService) {}

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  setIsOpen(value: boolean): void {
    this.isOpen = value;
  }

  onSubmit(): void {
    if (!this.input.trim() || this.isLoading) return;

    const userMessage: Message = { role: 'user', content: this.input.trim() };
    this.messages = [...this.messages, userMessage];
    this.shouldScrollToBottom = true;

    const currentInput = this.input;
    this.input = '';
    this.isLoading = true;
    this.error = null;

    const chatMessages: ChatMessage[] = this.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    this.llmService.chat(chatMessages).subscribe({
      next: (response) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.answer
        };
        this.messages = [...this.messages, assistantMessage];
        this.shouldScrollToBottom = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Có lỗi xảy ra khi gửi tin nhắn';
        this.isLoading = false;
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onScroll(): void {
    // Handle scroll events if needed
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }
}
