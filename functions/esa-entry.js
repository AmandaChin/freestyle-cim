import { handleConfirmationEmail } from "./api/public/confirmation-email.js";

// ESA 静态资源未命中时进入该边缘函数；这里只接管确认单邮件 API。
export default {
  async fetch(request, context, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/public/confirmation-email") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, message: "仅支持 POST 请求" }), {
        status: 405,
        headers: {
          "Allow": "POST",
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return handleConfirmationEmail(request, env);
  }
};
