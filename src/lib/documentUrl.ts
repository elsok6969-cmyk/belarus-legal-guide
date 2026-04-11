/** Build a public URL path for a document, preferring slug over id */
export function docUrl(doc: { slug?: string | null; id: string }, prefix = '/documents') {
  return `${prefix}/${doc.slug || doc.id}`;
}
