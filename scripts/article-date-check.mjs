// dateModified is optional. Never manufacture a revision date to satisfy a check.
export function articleDateErrors(schema, today = new Date().toISOString().slice(0, 10)) {
  const types = [schema?.['@type']].flat();
  if (!types.some(type => ['Article', 'BlogPosting', 'NewsArticle'].includes(type))) return [];
  const errors = [];
  const published = schema.datePublished;
  const modified = schema.dateModified;
  for (const [name, value] of [['datePublished', published], ['dateModified', modified]]) {
    if (value !== undefined && (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))) {
      errors.push(`Article ${name} is not a valid date`);
    }
  }
  if (published && modified && Date.parse(modified) < Date.parse(published)) {
    errors.push('Article modification date precedes publication');
  }
  if (typeof modified === 'string' && Number.isFinite(Date.parse(modified)) && modified.slice(0, 10) > today) {
    errors.push('Article modification date is in the future');
  }
  return errors;
}
