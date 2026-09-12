export async function onRequest(context) {
  const { request, env, params } = context;
  const apiOrigin = env.API_ORIGIN;

  if (!apiOrigin) {
    return Response.json(
      { error: { message: "API_ORIGIN is not configured", status: 500 } },
      { status: 500 }
    );
  }

  const { search } = new URL(request.url);
  const segments = Array.isArray(params.path)
    ? params.path
    : [params.path].filter(Boolean);
  const target = new URL(`/${segments.join("/")}${search}`, apiOrigin);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  return fetch(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });
}
