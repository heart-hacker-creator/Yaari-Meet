// Chat WebSocket -> chat server Worker
export const onRequest = ({ request, env }) => env.API.fetch(request);
