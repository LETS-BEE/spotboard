export default defineEventHandler(async (event) => {
  const storage = useStorage('data');
  const content: string | null = await storage.getItem('award_slide.json');

  if (!content) {
    return { slides: [] };
  }

  try {
    return JSON.parse(content);
  } catch (error) {
     console.error('Error parsing award slide file:', error);
    // If the content is malformed, return a default structure
    return { slides: [] };
  }
});
