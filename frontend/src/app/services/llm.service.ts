import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private llmBaseUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  chat(messages: ChatMessage[]): Observable<ChatResponse> {
    const request: ChatRequest = { messages };
    return this.http.post<ChatResponse>(`${this.llmBaseUrl}/chat`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('LLM API error:', error);
    return throwError(() => error);
  }
}
