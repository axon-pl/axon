/** Letter grade with strict >= boundaries, no rounding; out-of-range is "Invalid". */
export function classify_grade(score: number): string {
  if (score < 0 || score > 100) return 'Invalid';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
