/**
 * Filters input to allow only numeric characters (digits, decimal point, minus sign)
 * for numeric input mode in type-answer questions.
 */
export function filterNumericInput(value: string): string {
  // Allow digits (0-9), decimal point (.), and minus sign (-)
  // Using regex to remove any character that isn't in this set
  return value.replace(/[^\d.\-]/g, "");
}

/**
 * Handler for onChange events on numeric input fields.
 * Filters the input value to only allow numeric characters.
 */
export function handleNumericInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void,
  isNumericMode: boolean
): void {
  let newValue = e.target.value;
  if (isNumericMode) {
    newValue = filterNumericInput(newValue);
  }
  setter(newValue);
}
