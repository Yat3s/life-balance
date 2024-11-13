export const formatDate = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const maskPhoneNumber = (phone) => {
  if (!phone) return '';

  const phoneStr = String(phone);

  if (phoneStr.length < 7) return phoneStr;

  return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
