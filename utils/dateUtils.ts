export const calculateDaysLeft = (dateString?: string): number => {
  if (!dateString) return 0;

  const expiryDate = new Date(dateString);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffTime = expiryDate.getTime() - now.getTime();

  // Convert to days and round up to the nearest whole day
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
