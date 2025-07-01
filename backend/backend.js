/**
 * CONSTANTS
 */
const START_ROW = 4;
const NUMBER_OF_SCHOOLS = 80;
const NUMBER_OF_BUSES = 3;
const allowedUsers = ["sfttracker@gmail.com"];

function generateBusList() {
  const currentUser = Session.getActiveUser().getEmail();

  if (!allowedUsers.includes(currentUser)) {
    return
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const individualStatisticsSheet = spreadsheet.getSheetByName("INDIVIDUAL_STATISTICS");
  const busBreakdownSheet = spreadsheet.getSheetByName("BUS_BREAKDOWN_PER_SCHOOL");

  const data = individualStatisticsSheet.getRange("A4:C83").getValues();

  const output = [];
  let row = 4;

  data.forEach(([parentRow, schoolName, busCount]) => {
    if (!schoolName || !busCount) return;
    for (let i = 1; i <= busCount; i++) {
      output.push([row++, parentRow, schoolName, `BUS ${i}`]);
    }
  });
  const rangeToClear = busBreakdownSheet.getRange(4, 1, 500, 20);
  rangeToClear.setBorder(false, false, false, false, false, false);
  rangeToClear.clearContent();
  individualStatisticsSheet.getRange(4, 4, 80, 1).clearContent();
  busBreakdownSheet.getRange(4, 1, output.length, 4).setValues(output);
  busBreakdownSheet.getRange(4, 1, output.length, 20).setBorder(true, true, true, true, true, true);
}

function readSchoolNames() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("BUS_BREAKDOWN_PER_SCHOOL");

  const numRows = sheet.getLastRow() - 4 + 1;

  const values = sheet.getRange(START_ROW, 1, numRows, 4).getValues();

  const results = [];

  values.forEach((row, i) => {
    results.push({ Id: row[0], Name: `${row[2]} ${row[3]}` });
  });
  console.log(results)
  return results;
}

function updateAttendance(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("BUS_BREAKDOWN_PER_SCHOOL");
  const individualStatisticsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("INDIVIDUAL_STATISTICS");
  const now = new Date();
  // const timeStamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");
  const timeStamp = "15:00";


  // const data = {
  //   row: 6,
  //   toIncrease: 11,
  //   toDecrease: 9
  // }

  const parentRow = sheet.getRange(data.row, 2).getValue();

  if (data.toIncrease !== null) {
    const currentToIncrease = sheet.getRange(data.row, data.toIncrease).getValue();
    if (currentToIncrease < 1) {
      sheet.getRange(data.row, data.toIncrease).setValue(currentToIncrease + 1);
      sheet.getRange(data.row, data.toIncrease + 1).setValue(timeStamp);
      individualStatisticsSheet.getRange(parentRow, 4).setValue(timeStamp);
    }
  }

  if (data.toDecrease !== null) {
    const currentToDecrease = sheet.getRange(data.row, data.toDecrease).getValue();
    if (currentToDecrease > 0) {
      sheet.getRange(data.row, data.toDecrease).setValue(currentToDecrease - 1);
    }
  }
}

function doGet(e) {
  // Handle actual GET request
  let debugInfo = ``;
  try {
    const action = e.parameter.action;
    debugInfo = `doGet called. Action: ${action}`;
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    if (action === 'GET_SCHOOL_LIST') {
      const data = readSchoolNames();  // Your existing function to fetch data
      response.append(JSON.stringify({ debugInfo, data }));
      return response;
    } else {
      response.append(JSON.stringify({ error: 'Invalid action', debugInfo }));
      return response;
    }
  } catch (error) {
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);
    response.append(JSON.stringify({ error: `An error occurred: ${error.toString()}`, debugInfo }));
    return response;
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.row == null || typeof data.row !== "number") {
      return ContentService.createTextOutput("Invalid data").setMimeType(ContentService.MimeType.TEXT);
    }

    updateAttendance(data);

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}