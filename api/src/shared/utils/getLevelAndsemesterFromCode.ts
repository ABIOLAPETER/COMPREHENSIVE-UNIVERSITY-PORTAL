import { BadRequestError } from "../errors/AppError";


export const getLevelAndSemester = (code: string) => {
  // Extract the last 3 digits of the code — e.g. "CSC301" → "301"
  const digits = code.replace(/\D/g, "").slice(-3);

  if (digits.length !== 3) {
    throw new BadRequestError(
      "Course code must contain at least 3 digits (e.g. CSC301)"
    );
  }

  const levelDigit    = parseInt(digits[0], 10); // "3" → 3
  const semesterDigit = parseInt(digits[2], 10); // "1" → 1

  if (isNaN(levelDigit) || isNaN(semesterDigit)) {
    throw new BadRequestError("Could not parse level or semester from course code");
  }

  if (![1, 2, 3, 4, 5].includes(levelDigit)) {
    throw new BadRequestError("Level digit must be between 1 and 5 (e.g. 1 → 100 Level)");
  }

  if (![1, 2].includes(semesterDigit)) {
    throw new BadRequestError("Semester digit must be 1 (First) or 2 (Second)");
  }

  const level    = levelDigit * 100;                          // 3 → 300
  const semester = semesterDigit === 1 ? "FIRST" : "SECOND"; // 1 → "FIRST", 2 → "SECOND"

  return { level, semester };
};