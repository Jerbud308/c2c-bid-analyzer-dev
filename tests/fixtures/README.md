# Test Fixtures

This directory contains test fixtures for E2E and integration testing.

## Files

- **sample.txt** - Sample text file for testing file type validation
- **sample.pdf** - Sample PDF for E2E upload testing (to be added)

## Creating a Sample PDF

Since we can't programmatically generate a real PDF in plain text, you can create a sample PDF using one of these methods:

### Method 1: Using Python (if available)
```bash
python3 << 'EOF'
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

c = canvas.Canvas("sample.pdf", pagesize=letter)
c.drawString(100, 750, "Sample Bid Package for Testing")
c.drawString(100, 730, "SOLICITATION: TEST-001")
c.drawString(100, 710, "")
c.drawString(100, 690, "SCOPE OF WORK")
c.drawString(100, 670, "Complete roof replacement on Building 453")
c.showPage()
c.save()
EOF
```

### Method 2: Using LibreOffice (if available)
```bash
libreoffice --headless --convert-to pdf sample.txt
```

### Method 3: Manual Creation
1. Create a simple document in any word processor
2. Add text like "Sample Bid Package - TEST-001"
3. Export/Save as PDF
4. Name it `sample.pdf` and place it in this directory

### Method 4: Download a sample
Download any small PDF and rename it to `sample.pdf`

## Note

The E2E tests will be skipped until a sample PDF is available and a frontend is implemented.
