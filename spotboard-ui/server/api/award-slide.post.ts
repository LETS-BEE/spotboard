export default defineEventHandler(async (event) => {
  const { password, content } = await readBody(event);

  // In a real app, use a more secure way to store and check the password.
  const correctPassword = process.env.AWARD_SLIDE_PASSWORD || 'domjudge';

  if (password !== correctPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid password',
    });
  }

  try {
    // Validate if the content is valid JSON
    JSON.parse(content);
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Content is not valid JSON.',
    });
  }

  try {
    // Use Nuxt server storage
    const storage = useStorage('data');
    await storage.setItem('award_slide.json', content);

    return { success: true, message: 'Award slide content updated successfully.' };
  } catch (error) {
    console.error('Error writing award slide file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not write to file.',
    });
  }
});
