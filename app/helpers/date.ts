import dayjs from "dayjs";
import type { HubDetails } from "~/types/transport.type";

/**
 * Get all dates from today until the cutoff_date with time set to 00:00:00.
 * @param cutoff_date - Number of days to add to today's date.
 * @returns An array of Date objects from today until the cutoff_date.
 */
function getCutoffDates(cutoff_date: number): Date[] {
  const today = dayjs().startOf("day"); // Start with time 00:00:00
  const cutoffDates: Date[] = [];

  for (let i = 1; i <= cutoff_date; i++) {
    const nextDate = today.add(i, "day").toDate(); // Use dayjs to manipulate dates
    cutoffDates.push(nextDate);
  }

  return cutoffDates;
}

/**
 * Get all unique days in the current month that correspond to the pickup_days and hub_hours.
 * @param pickup_days - Array of days of the week (0-6).
 * @param hub_hours - Array of days of the week (0-6).
 * @returns An array of unique days.
 */
function getUniqueDays(pickup_days: number[], hub_hours: number[]): number[] {
  const weekdaysMap = [0, 1, 2, 3, 4, 5, 6]; // Full week (0 = Sunday, 1 = Monday, etc.)

  // Dapatkan elemen yang hanya ada di array1
  const array1 = pickup_days.filter((value) => !hub_hours.includes(value));

  // Dapatkan elemen yang hanya ada di array2
  const array2 = hub_hours.filter((value) => !pickup_days.includes(value));

  const array3 = weekdaysMap.filter(
    (day) => !(pickup_days.includes(day) && hub_hours.includes(day)),
  );
  // Gabungkan kedua hasil
  const result = [...new Set([...array1, ...array2, ...array3])];

  // const result = array1.concat(array2).concat(array3);
  return result;
}

/**
 * Get all dates in the current month that correspond to the unique days.
 * @param uniqueDays - Array of unique days of the week (0-6).
 * @returns An array of Date objects for each unique day in the current month.
 */
export function getPickupDates(
  daysArray: number[],
  month?: number,
  year?: number,
): Date[] {
  // Use the current month and year if not provided
  const currentDate = dayjs();
  const selectedMonth = month ?? currentDate.month() + 1; // dayjs month starts from 0, so add 1
  const selectedYear = year ?? currentDate.year();

  let dates: Date[] = [];

  // Loop through each day in the daysArray
  daysArray.forEach((day) => {
    // Iterate through each day in the selected month
    const daysInMonth = dayjs(
      `${selectedYear}-${selectedMonth}-01`,
    ).daysInMonth();
    for (let date = 1; date <= daysInMonth; date++) {
      let currentDay = dayjs(`${selectedYear}-${selectedMonth}-${date}`);

      // Check if the day in currentDay matches the day in daysArray
      if (currentDay.day() === day) {
        // Set the time to 00:00:00 and convert to Date
        dates.push(currentDay.startOf("day").toDate()); // Set to start of day and convert to Date
      }
    }
  });

  return dates; // Return array containing Date objects
}

/**
 * Convert holiday_infos into a Date[] array with time set to 00:00:00.
 * @param data - The hub data object containing holiday_infos and other fields.
 * @returns Array of holiday dates as JavaScript Date objects.
 */
function getHolidays(data: HubDetails): Date[] {
  return data.holiday_infos.map((dateString) => {
    return dayjs(dateString).startOf("day").toDate(); // Set to start of day and convert to Date
  });
}
/**
 * Get all relevant dates based on the HubDetails.
 * @param data - The hub data object.
 * @returns An object containing cutoff date, pickup dates, and holiday dates.
 */
export function getRelevantDates(
  data?: HubDetails,
  month?: number,
  year?: number,
): Date[] {
  if (!data) return [];

  const cutoffDates = getCutoffDates(data.cutoff_date);
  // console.log("Cutoff Date:", cutoffDates);
  const uniqueDays = getUniqueDays(data.pickup_days, data.hub_hours);
  // console.log("Unique Days:", uniqueDays);
  const pickupDates = getPickupDates(uniqueDays, month, year);
  // console.log("Pickup Dates:", pickupDates);
  const holidays = getHolidays(data);
  // console.log("Holidays:", holidays);

  // Combine all dates into one array and remove duplicates
  const allDates = [...cutoffDates, ...pickupDates, ...holidays];

  // Remove duplicate dates
  const uniqueDates = Array.from(
    new Set(allDates.map((date) => date.toISOString())),
  ).map((date) => new Date(date));

  // console.log("All Dates:", allDates);

  // console.log("Unique Dates:", uniqueDates);
  return uniqueDates;
}

// Example usage:
// const data: HubDetails = {
//   cutoff_date: 4,
//   pickup_days: [0, 2, 4, 5, 6], // Sunday, Tuesday, Thursday, Friday, Saturday
//   holiday_infos: ["2024-10-23", "2024-10-25", "2024-10-29"],
//   hub_hours: [1, 3, 5], // Days (1 = Monday, 3 = Wednesday, 5 = Friday)
// };

// const relevantDates = getRelevantDates(data);
// console.log(relevantDates);
// console.log("Cutoff Date:", relevantDates.cutoffDate);
// console.log("Pickup Dates:", relevantDates.pickupDates);
// console.log("Holidays:", relevantDates.holidays);
