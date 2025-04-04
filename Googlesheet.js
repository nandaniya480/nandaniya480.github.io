function calculateInOutTimesForSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let weeklyTotalInTime = 0;
  let totalPlusMinus = 0;
  const eightAndHalfHoursInMs = 8.5 * 60 * 60 * 1000;
  let fullWeekHoursInMs = 42.5 * 60 * 60 * 1000;
  let leaveDaysInWeek = 0;

  for (let i = 1; i < data.length; i++) {
    const isLeaveDay = data[i][4] === "Leave";
    if (isLeaveDay) {
      fullWeekHoursInMs = fullWeekHoursInMs - eightAndHalfHoursInMs;
      leaveDaysInWeek++;
    }

    const { totalInTime, totalOutTime, firstTimestamp } = calculateRowTimes(data[i]);
    const dayDate = data[i][0];
    const dayName = dayDate.toString().slice(0, 3);
    const isToday = checkIfToday(dayDate);

    if (daysOfWeek.includes(dayName)) {
      weeklyTotalInTime += totalInTime;
    }

    if (firstTimestamp) {
      const { escapeTimeFormatted, remainingTimeFormatted, totalPlusMinus: updatedTotalPlusMinus } = calculateEscapeTime(dayDate, totalInTime, totalOutTime, firstTimestamp, weeklyTotalInTime, totalPlusMinus, eightAndHalfHoursInMs, isToday, daysOfWeek, leaveDaysInWeek);
      totalPlusMinus = updatedTotalPlusMinus;
      updateEscapeTimeColumn(sheet, i, escapeTimeFormatted, remainingTimeFormatted, isToday);
    }

    if (dayName === "Sun") {
      updateWeeklyTotals(sheet, i, weeklyTotalInTime, totalPlusMinus, dayDate, fullWeekHoursInMs);
      weeklyTotalInTime = 0;
      totalPlusMinus = 0;
      leaveDaysInWeek = 0;
      fullWeekHoursInMs = 42.5 * 60 * 60 * 1000;
    } else {
      updateRowTotals(sheet, i, totalInTime, totalOutTime);
    }
  }
}

function calculateRowTimes(rowData) {
  let totalInTime = 0;
  let totalOutTime = 0;
  let firstTimestamp = null;
  const dayDate = rowData[0];
  const currentDate = new Date();
  const currentTime = currentDate.toLocaleTimeString('en-US', { hour12: false });

  for (let j = 5; j < rowData.length; j += 2) {
    const inTime = rowData[j];
    let outTime = rowData[j + 1];
    const year = dayDate.getFullYear();
    const month = String(dayDate.getMonth() + 1).padStart(2, '0');
    const day = String(dayDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    if (!outTime && inTime) {
      outTime = new Date(`${formattedDate}T${currentTime}`);
    }

    // if (inTime && outTime && String(inTime).trim() !== '' && String(outTime).trim() !== '') {
    if (inTime && outTime) {
      const inDateTime = parseTime(dayDate, inTime);
      const outDateTime = parseTime(dayDate, outTime);
      if (!firstTimestamp) {
        firstTimestamp = inDateTime;
      }
      const inDuration = outDateTime - inDateTime;
      totalInTime += inDuration;
      const nextInTime = (j + 2 < rowData.length && String(rowData[j + 2]).trim() !== '') ? rowData[j + 2] : null;
      if (nextInTime) {
        const nextInDateTime = parseTime(dayDate, nextInTime);
        const outDuration = nextInDateTime - outDateTime;
        totalOutTime += outDuration;
      }
    }
  }
  return { totalInTime, totalOutTime, firstTimestamp };
}

function calculateEscapeTime(dayDate, totalInTime, totalOutTime, firstTimestamp, weeklyTotalInTime, totalPlusMinus, eightAndHalfHoursInMs, isToday, daysOfWeek, leaveDaysInWeek) {
  const addTime = eightAndHalfHoursInMs + totalOutTime;
  const estimatedOutTime = new Date(firstTimestamp.getTime() + addTime);

  let escapeHour = estimatedOutTime.getHours();
  const escapeMinute = estimatedOutTime.getMinutes();
  const period = escapeHour >= 12 ? 'PM' : 'AM';
  escapeHour = escapeHour % 12 || 12;
  const escapeTimeFormatted = `${escapeHour}:${String(escapeMinute).padStart(2, '0')} ${period}`;

  const remainingTimeInMs = totalInTime - eightAndHalfHoursInMs;
  const remainingTimeFormatted = `( ${formatDuration(remainingTimeInMs)} )`;

  if (isToday) {
    const todayIndex = daysOfWeek.indexOf(dayDate.toString().slice(0, 3));
    if (todayIndex > 0) {
      const pastDaysLength = daysOfWeek.slice(0, todayIndex).length;
      totalPlusMinus = weeklyTotalInTime - ((eightAndHalfHoursInMs * (pastDaysLength - leaveDaysInWeek)) + (Math.min(totalInTime, eightAndHalfHoursInMs)));
    }
  }
  return { escapeTimeFormatted, remainingTimeFormatted, totalPlusMinus };
}

function updateEscapeTimeColumn(sheet, rowIndex, escapeTimeFormatted, remainingTimeFormatted, isToday) {
  const currentTime = isToday ? ` ${new Date().toLocaleTimeString('en-US', { hour12: true })}` : '';
  sheet.getRange(rowIndex + 1, 4).setValue(`${escapeTimeFormatted} ${remainingTimeFormatted}${currentTime}`);
}

function updateWeeklyTotals(sheet, rowIndex, weeklyTotalInTime, totalPlusMinus, dayDate, fullWeekHoursInMs) {
  const currentWeek = isDateInCurrentWeek(dayDate);
  sheet.getRange(rowIndex + 1, 2).setValue(`${formatDuration(weeklyTotalInTime)}${currentWeek ? ` (${formatDuration(totalPlusMinus)})` : ""}`);
  sheet.getRange(rowIndex + 1, 3).setValue(formatDuration(weeklyTotalInTime - fullWeekHoursInMs));
}

function updateRowTotals(sheet, rowIndex, totalInTime, totalOutTime) {
  sheet.getRange(rowIndex + 1, 2).setValue(totalInTime > 0 ? formatDuration(totalInTime) : "");
  sheet.getRange(rowIndex + 1, 3).setValue(totalOutTime > 0 ? formatDuration(totalOutTime) : "");
}

// function parseTime(date, timeString) {
//   try {
//     if (timeString.getHours() && timeString.getMinutes()) {
//       return new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeString.getHours(), timeString.getMinutes());
//     } else {
//       const [hours, minutes] = timeString.split(':').map(Number);
//       return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
//     }
//   } catch (error) {
//     logError(error.message, [date, timeString]);
//   }
// }

function parseTime(date, timeString) {
  try {
    if (timeString instanceof Date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeString.getHours(), timeString.getMinutes());
    } else if (typeof timeString === 'string' && timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid time format: ${timeString}`);
      }
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    } else {
      throw new Error("Invalid timeString format.");
    }
  } catch (error) {
    logError(error.message, [date, timeString]);
    return null;
  }
}


function formatDuration(duration) {
  const isNegative = duration < 0;
  const absDuration = Math.abs(duration);
  const hours = String(Math.floor(absDuration / (1000 * 60 * 60)));
  const minutes = String(Math.floor((absDuration % (1000 * 60 * 60)) / (1000 * 60)));
  return `${isNegative ? '-' : ''}${hours}h ${minutes} m`;
}

function isDateInCurrentWeek(date) {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(today.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
}

function checkIfToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

function logError(message, additionalInfo = []) {
  const sheetName = "Error Log";
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = spreadsheet.getSheetByName(sheetName);

  if (!logSheet) {
    logSheet = spreadsheet.insertSheet(sheetName);
    logSheet.appendRow(["Timestamp", "Error Message", "Additional Info"]);
  }

  const formattedInfo = Array.isArray(additionalInfo)
    ? additionalInfo.join(", ")
    : additionalInfo;
  logSheet.appendRow([new Date(), message, formattedInfo]);
}
