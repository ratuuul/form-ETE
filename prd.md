📄 PRD — Custom Student Registration Form (React)

1. Overview

Build a React-based custom registration form that collects student data and submits it to a backend Google Apps Script endpoint connected to Google Sheets.

The form also integrates image uploads via Cloudinary and includes real-time validation rules.

Backend endpoint:

https://script.google.com/macros/s/AKfycbxzwwsON0TAhpPyRKSYsz06YZG0Sq7SZbp-mW_tA7Gq/dev 2. Tech Stack
Frontend: React (Vite or Next.js)
Storage: Google Sheets via Apps Script
Image Hosting: Cloudinary
API: Google Apps Script Web App 3. Form Fields
Required Fields (must be filled)
Name
Roll Number
Email
Phone Number
Series
School
College
Sheets Link
Home Town
Facebook Profile URL
Consent Checkbox (mandatory)
Optional Fields
Skills
Image Upload 4. Validation Rules (Live / Real-Time)
📱 Phone Number Validation
Minimum: 11 digits
If < 11 digits:
Show live warning
Prevent green/valid state
No validation delay (instant feedback on typing)
📧 Email Validation
Must include:
@
domain (e.g. .com, .net, .edu)
If missing domain:
Show live warning immediately
Example invalid:
user@
user@gmail
☑️ Consent Checkbox
Must be checked before submit
If not checked:
disable submit button OR show warning
🧾 Required Field Rule
All fields EXCEPT:
Image Upload
Skills
must be filled before submission
Missing field → inline red warning 5. Image Upload Flow
User selects image
Upload to Cloudinary (unsigned preset)
Receive secure URL
Send URL to backend as image_url 6. Submission Flow
Validate all fields in frontend
Upload image (if provided)
Send JSON payload to Apps Script endpoint
Apps Script writes data into Google Sheets row 7. Payload Structure (Frontend → Backend)
{
"name": "",
"roll": "",
"email": "",
"phone": "",
"series": "",
"school": "",
"college": "",
"sheets": "",
"hometown": "",
"facebook_profile": "",
"skills": "",
"image_url": ""
} 8. UX Requirements
Instant validation (no waiting for submit)
Inline error messages under fields
Submit button disabled until valid
Loading state during submission
Success confirmation after response 9. Error Handling
Network failure → show retry message
Cloudinary failure → allow submit without image
Apps Script failure → show “submission failed” 10. Security Notes

Cloudinary credentials must be stored in .env:

REACT_APP_CLOUDINARY_CLOUD_NAME=**_
REACT_APP_CLOUDINARY_UPLOAD_PRESET=_**
Never expose keys in frontend code directly
Apps Script endpoint is public, so no sensitive data should be stored 11. Future Enhancements
Edit submission system (like Google Forms)
Admin dashboard for viewing all students
Profile page generation from Sheets
Duplicate roll/email prevention
Auto-generated student ID system
