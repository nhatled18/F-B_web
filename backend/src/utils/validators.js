/**
 * Validate và parse số nguyên không âm
 * @param {any} value
 * @param {string} fieldName
 * @throws {Error} nếu không hợp lệ
 */
export function parseNonNegativeInt(value, fieldName) {
  const num = Number(value);
  if (isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`${fieldName} phải là số hợp lệ`);
  }
  if (num < 0) {
    throw new Error(`${fieldName} không được âm`);
  }
  return Math.floor(num); // đảm bảo integer
}

/**
 * Validate và parse số không âm (float OK)
 */
export function parseNonNegativeFloat(value, fieldName) {
  const num = Number(value);
  if (isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`${fieldName} phải là số hợp lệ`);
  }
  if (num < 0) {
    throw new Error(`${fieldName} không được âm`);
  }
  return num;
}

/**
 * Parse số nếu định nghĩa, fallback về giá trị cũ
 */
export function parseIfDefined(value, fallback, parser) {
  return value !== undefined ? parser(value) : fallback;
}

/**
 * Trim string hoặc trả về ''
 */
export function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}