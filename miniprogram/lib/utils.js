export const formatDate = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const maskPhoneNumber = (phone) => {
  if (!phone) return "";

  const phoneStr = String(phone);

  if (phoneStr.length < 7) return phoneStr;

  return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
};

export function formatPromotionValue(promotion) {
  if (promotion.type === "discount") {
    const value = Number(promotion.value);
    if (value % 1 === 0) {
      return promotion.value; // No decimal places, return as is
    } else {
      const decimalPlaces = promotion.value.toString().split(".")[1].length;
      return promotion.value * (decimalPlaces === 1 ? 10 : 100);
    }
  }
  // not discount type
  if (promotion.type !== "discount") {
    return promotion.value;
  }
}
