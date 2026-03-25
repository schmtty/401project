export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return value;
  const [, area, prefix, line] = match;
  let formatted = "";
  if (area) formatted += `(${area}`;
  if (prefix) formatted += `) ${prefix}`;
  if (line) formatted += `-${line}`;
  return formatted;
};
