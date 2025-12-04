export default defineEventHandler(async (event) => {
  const dataStorage = useStorage('data');
  let content: any = await dataStorage.getItem('award_slide.json');

  // If no user-saved content exists, fall back to the default template.
  if (!content) {
    const assetStorage = useStorage('assets:server');
    content = await assetStorage.getItem('content:award_slide.json');
  }

  // If there's still no content, return a default empty structure.
  if (!content) {
    // Check if we can just return empty
    return { slides: [] };
  }

  // If content is already an object, return it.
  if (typeof content === 'object') {
      return content;
  }

  try {
    // The content from storage might be a stringified JSON, so we parse it.
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing award slide file:', error, 'Content:', content);
    // If the content is malformed, return a default structure
    return { slides: [] };
  }
});
