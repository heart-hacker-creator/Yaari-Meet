// /api/* (payments, verification, visits, stats) -> chat server Worker.
// Adds the visitor's approximate location (from Cloudflare) for the visit alerts;
// anything a browser sends in these headers is overwritten.
export const onRequest = ({ request, env }) => {
  const forwarded = new Request(request);
  const cf = request.cf ?? {};
  forwarded.headers.set("x-visitor-city", encodeURIComponent(cf.city ?? ""));
  forwarded.headers.set("x-visitor-region", encodeURIComponent(cf.region ?? ""));
  forwarded.headers.set("x-visitor-country", encodeURIComponent(cf.country ?? ""));
  return env.API.fetch(forwarded);
};
