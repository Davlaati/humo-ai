export const calculateDaysLeft = (dateString?: string | null): number => {
  // If null, undefined, or empty, return 0 immediately
  if (!dateString) return 0;

  const expiryDate = new Date(dateString);
  const now = new Date();

  // If the date is invalid or in the past, return 0
  if (isNaN(expiryDate.getTime()) || expiryDate <= now) {
    return 0;
  }

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

export const calculateDaysUsed = (joinedAtString?: string): number => {
  if (!joinedAtString) return 0;

  const joinedDate = new Date(joinedAtString);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffTime = now.getTime() - joinedDate.getTime();

  // Convert to days and round down to the nearest whole day
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
};
