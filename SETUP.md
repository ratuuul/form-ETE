# Student Registration Form - Setup Guide

## Quick Start

### 1. Google Sheets Integration (Backend)

**Option A: Use Your Existing Google Apps Script Library**

Your library URL: `https://script.google.com/macros/library/d/1FnluTIFeKufZEK6-Hd4pAZyJT4XuA9qDuiqgjUbcYLawjd30eCzh3Qyz/1`

1. Go to Google Apps Script: https://script.google.com/
2. Create a new standalone project
3. Include the library by going to Libraries and adding your library ID
4. Create a function that calls the library:

```javascript
// In your Apps Script project
function doPost(e) {
  // Call your library function here
  // Example:
  return YourLibraryName.doPost(e);
}
```

5. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
6. Copy the Web App URL (ends with /exec)
7. Update `src/App.jsx` line 4:
   ```javascript
   const BACKEND_URL = 'YOUR_WEB_APP_URL_HERE';
   ```

**Option B: Create New from Included Code**

1. Go to https://script.google.com/
2. Create new project
3. Copy code from `GAS_CODE.gs`
4. Replace `SPREADSHEET_ID` with your Google Sheet URL ID:
   - Example Sheet URL: `https://docs.google.com/spreadsheets/d/ABC123XYZ456/edit`
   - ID is: `ABC123XYZ456`
5. Deploy as Web App (Anyone access, Me as executor)
6. Copy the URL and update `src/App.jsx`

---

### 2. Cloudinary Setup (Image Upload)

**Step 1: Create Cloudinary Account**
1. Go to https://cloudinary.com/
2. Sign up for free account

**Step 2: Get Your Credentials**
1. Go to Dashboard
2. Note your "Cloud Name" (e.g., `mycloud`)
3. Go to Settings > Upload
4. Scroll to "Upload presets"
5. Add upload preset (if not exists):
   - Name: any name
   - Signing Mode: Unsigned
   - Save

**Step 3: Configure Environment Variables**

Create a `.env` file in the project root:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

Example:
```env
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

---

### 3. Run the Application

```bash
npm install
npm run dev
```

The form will be available at `http://localhost:5173`

---

## Data Flow

```
User Form → Cloudinary (image) → Google Apps Script → Google Sheets
                           ↓
                    (optional) ← Failed upload doesn't block submission
```

---

## Troubleshooting

**Google Sheets not receiving data:**
- Check browser console for errors
- Verify Web App URL is correct in App.jsx
- Make sure Google Apps Script is deployed with "Anyone" access

**Image upload fails:**
- Verify Cloudinary credentials in .env
- Check upload preset is set to "Unsigned"
- Image size must be under 10MB

**Form validation not working:**
- Phone must have 11+ digits
- Email must have @ and domain (.com, .net, etc.)
- All required fields must be filled
- Consent checkbox must be checked