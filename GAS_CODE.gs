/**
 * Google Apps Script - Student Registration Form Handler
 *
 * Receives URLSearchParams from React app and writes to Google Sheets.
 * Column order MUST match the order sent from frontend.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Students';

/**
 * doPost - Handle POST requests from the form
 * Parses URLSearchParams, NOT JSON
 */
function doPost(e) {
  try {
    // Parse URLSearchParams, NOT JSON
    const param = e.parameter;

    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();

    // Prepare row data in EXACT order
    const rowData = [
      new Date().toISOString(),
      param.name || '',
      param.roll || '',
      param.email || '',
      param.phone || '',
      param.series || '',
      param.school || '',
      param.college || '',
      param.hometown || '',
      param.facebook_profile || '',
      param.skills || '',
      param.image_url || ''
    ];

    // Append row to sheet
    sheet.appendRow(rowData);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get or create the spreadsheet and sheet
 */
function getOrCreateSheet() {
  let spreadsheet;

  try {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    spreadsheet = SpreadsheetApp.create('Student Registrations');
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);

    // Headers MUST match the order in rowData above
    sheet.appendRow([
      'Timestamp',
      'name',
      'roll',
      'email',
      'phone',
      'series',
      'school',
      'college',
      'hometown',
      'facebook_profile',
      'skills',
      'image_url'
    ]);

    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Get the Web App URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}