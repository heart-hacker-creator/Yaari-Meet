// /api/* (payments, verification, stats) -> chat server Worker
export const onRequest = ({ request, env }) => env.API.fetch(request);
