export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ');
}

export function includesQuery(value: string, query: string) {
  return stripHtml(value).toLocaleLowerCase().includes(query);
}
