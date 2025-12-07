export const useDomjudgeApi = () => {
    const config = useRuntimeConfig();
    const baseUrl = config.public.domjudgeApiBaseUrl;
    const username = config.public.domjudgeUsername;
    const password = config.public.domjudgePassword;

    // Create Basic Auth header
    let authHeader = '';
    if (username && password) {
        const credentials = `${username}:${password}`;
        // Use btoa in browser, Buffer in Node.js
        const encoded = import.meta.client
            ? btoa(credentials)
            : Buffer.from(credentials).toString('base64');
        authHeader = `Basic ${encoded}`;
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    return $fetch.create({
        baseURL: baseUrl as string,
        headers: headers,
        timeout: 3000,
    });
};
