import { AttendanceRecord } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const calculateAttendancePercentage = (records: AttendanceRecord[]) => {
  if (records.length === 0) return 0;
  const present = records.filter(r => r.status === 'Present').length;
  return Math.round((present / records.length) * 100);
};

export const getMonthlyAttendance = (records: AttendanceRecord[], date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return records.filter(r => {
    const recordDate = r.date.toDate();
    return isWithinInterval(recordDate, { start, end });
  });
};

export const getAttendanceStatusColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 75) return 'text-blue-600';
  return 'text-red-600';
};

export const getAttendanceStatusBg = (percentage: number) => {
  if (percentage >= 90) return 'bg-green-50';
  if (percentage >= 75) return 'bg-blue-50';
  return 'bg-red-50';
};
