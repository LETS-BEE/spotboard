export default defineEventHandler(async (event) => {
  const dataStorage = useStorage('data');
  let content: string | null = await dataStorage.getItem('award_slide.json');

  // If no user-saved content exists, fall back to the default template.
  if (!content) {
    const assetStorage = useStorage('assets:server');
    content = await assetStorage.getItem('content:award_slide.json');
  }

  // If there's still no content, return a default empty structure.
  if (!content) {
    console.error('Award slide content not found in data storage or as a default asset.');
    return { slides: [] };
  }

  try {
    // The content from storage might be a stringified JSON, so we parse it.
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing award slide file:', error);
    // If the content is malformed, return a default structure
    return { slides: [] };
  }
});
