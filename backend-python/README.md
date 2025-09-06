# Document AI - Sensitive Information Detection

Backend service for detecting sensitive information in PDF and DOCX files using FastAPI.

## Features

- Extract text from PDF and DOCX files
- Detect sensitive information using regex patterns:
  - CMND/CCCD (9 or 12 digits)
  - Tax codes (10 or 13 digits)
  - Bank account numbers (8-16 digits)
  - Email addresses
  - Phone numbers (Vietnam format)
  - Enterprise tax codes
  - Credit card numbers
  - Social insurance numbers

## Requirements

- Docker
- Docker Compose (optional)

## Building and Running

### Using Docker

1. Build the image:
```bash
docker build -t docai-backend-python .
```

2. Run the container:
```bash
docker run -p 8081:8081 docai-backend-python
```

### Using Docker Compose

```bash
docker-compose up --build
```

The API will be available at `http://localhost:8081`

## API Documentation

### POST /detect

Upload a PDF or DOCX file and detect sensitive information.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body parameter: `file` (PDF or DOCX file)

**Response:**
```json
{
  "sensitive_info": [
    {
      "type": "CMND/CCCD",
      "value": "123456789",
      "start": 100,
      "end": 109
    },
    {
      "type": "Email",
      "value": "example@email.com",
      "start": 150,
      "end": 166
    }
  ]
}
```

**Error Response:**
```json
{
  "detail": "Error message"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Testing the API

You can test the API using curl:

```bash
# Health check
curl http://localhost:8081/health

# Upload and detect sensitive info
curl -X POST http://localhost:8081/detect \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

Or using the Swagger UI at `http://localhost:8081/docs`

## Development

The service uses the following main dependencies:
- FastAPI: Web framework
- pdfplumber: PDF text extraction
- python-docx: DOCX text extraction
- regex: Pattern matching for sensitive information

## Notes

- The service creates a temporary directory for file processing
- Files are deleted immediately after processing
- All sensitive information detection is done locally (no external API calls)
- The service supports both PDF and DOCX files
- Response includes the position (start/end) of each detected item in the text
