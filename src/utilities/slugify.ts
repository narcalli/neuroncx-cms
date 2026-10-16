/** Lowercase letters, numbers and single dashes from any text, for example "Book and get paid" to book-and-get-paid. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
