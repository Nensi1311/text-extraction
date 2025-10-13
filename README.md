# 📄 PDF Transaction Extractor

A full-stack web application that automatically extracts financial transactions from bank statement PDFs using AI-powered text processing. The application processes PDF files, extracts transaction data and exports the results as CSV files.

## ✨ Features

- **PDF Upload**: Drag-and-drop or click to upload bank statement PDFs
- **AI-Powered Extraction**: Uses OpenRouter's advanced language models to intelligently parse transaction data
- **Data Standardization**: Automatically converts dates to ISO format and normalizes amounts
- **CSV Export**: Download extracted transactions as CSV files
- **Real-time Processing**: Live extraction and preview of transaction data
- **Responsive UI**: Clean, modern interface built with React

## 🏗️ Architecture

### Backend (Node.js/Express)
- **API Routes**: RESTful endpoints for file upload and processing
- **PDF Processing**: Extracts text from PDF files using `pdf-parse`
- **AI Integration**: Uses OpenRouter API with Qwen models for intelligent data extraction
- **File Management**: Handles temporary file storage and cleanup
- **CSV Generation**: Creates downloadable CSV files with extracted data

### Frontend (React)
- **File Upload Interface**: Intuitive drag-and-drop file selection
- **Data Display**: Table view of extracted transactions
- **Download Management**: Direct CSV download links
- **Error Handling**: User-friendly error messages and loading states

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nensi1311/text-extraction.git
   cd text-extraction
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=5000
   ```

4. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

5. **Start the application**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
text-extraction/
├── backend/
│   ├── api/
│   │   ├── app.js                 # Express app configuration
│   │   └── routes/
│   │       └── uploadRoutes.js    # File upload endpoints
│   ├── helpers/
│   │   └── pdfParse.js           # PDF text extraction utility
│   └── services/
│       ├── llmService.js         # OpenRouter API integration
│       └── pdfExtractor.js       # Transaction extraction logic
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js                # Main React component
│   │   ├── App.css               # Styling
│   │   └── index.js              # React entry point
│   └── build/                    # Production build
├── uploads/                      # Temporary file storage
├── server.js                     # Main server file
└── package.json                  # Dependencies and scripts
```

## 🔧 API Endpoints

### POST `/api/upload`
Upload and process a PDF file to extract transactions.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: PDF file

**Response:**
```json
{
  "success": true,
  "message": "Transactions extracted",
  "count": 25,
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "ATM WITHDRAWAL",
      "amount": 500.00,
      "type": "Debit",
      "balance": 4500.00
    }
  ],
  "csvUrl": "/uploads/transactions_1234567890.csv"
}
```

## 🛠️ Technologies Used

### Backend
- **Express.js**: Web framework
- **Multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **OpenRouter**: AI model API
- **jsonrepair**: JSON validation and repair
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: UI framework
- **Axios**: HTTP client
- **React Icons**: Icon components
- **CSS3**: Styling

### AI/ML
- **OpenRouter API**: Access to various language models
- **Qwen 3-235B**: Primary model for transaction extraction

## 📊 Data Extraction Process

1. **PDF Upload**: User uploads a bank statement PDF
2. **Text Extraction**: PDF is parsed to extract raw text content
3. **AI Processing**: OpenRouter model analyzes and structures the data
4. **Data Validation**: Extracted data is cleaned and validated
5. **CSV Generation**: Structured data is exported as CSV
6. **File Cleanup**: Temporary files are removed

## 🔒 Security Features

- Temporary file cleanup after processing
- Input validation and sanitization
- Error handling for malformed data
- CORS protection

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Start production server
npm start
```

### Environment Variables
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `PORT`: Server port (default: 5000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your OpenRouter API key is correctly set in the `.env` file
2. **PDF Processing Failed**: Check if the PDF is not password-protected and contains readable text
3. **Build Errors**: Make sure all dependencies are installed and Node.js version is compatible