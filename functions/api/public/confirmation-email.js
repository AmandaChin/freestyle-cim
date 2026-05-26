const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function safeFileName(value) {
  return String(value || "customer").replace(/[\\/:*?"<>|]/g, "-");
}

function htmlToBase64(value) {
  // Resend attachments require base64 content; TextEncoder keeps Chinese confirmation-sheet text intact.
  const text = String(value || "");
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function dataUrlAttachmentContent(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1] || "application/octet-stream", content: match[2] };
}

function isValidEmail(value) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value || "").trim());
}

function embroideryImageAttachments(embroidery = []) {
  // Customer-uploaded embroidery images are forwarded as separate production-sheet attachments.
  if (!Array.isArray(embroidery)) return [];
  return embroidery.flatMap((entry) => {
    const image = entry?.image;
    const parsed = dataUrlAttachmentContent(image?.dataUrl);
    if (!parsed) return [];
    const prefix = [entry.code, entry.name].filter(Boolean).join("-") || "remark-image";
    return [{
      filename: safeFileName(`${prefix}-${image.name || "attachment"}`),
      contentType: image.type || parsed.contentType,
      content: parsed.content
    }];
  });
}

function payloadProductName(product) {
  if (typeof product === "string") return product;
  return product?.name || product?.title || product?.model || "Skate CIM";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  // Pages Functions do not run the local Node backend, so the production route sends via Resend directly.
  const confirmationEmailTo = String(env.CONFIRMATION_EMAIL_TO || "").trim();
  const resendApiKey = env.RESEND_API_KEY || "";
  const resendFrom = env.RESEND_FROM || "";
  const fetchImpl = env.fetch || fetch;
  const payload = await readJson(request);

  console.log("[confirmation-email] Pages request", {
    hasRecipient: Boolean(confirmationEmailTo),
    hasResendApiKey: Boolean(resendApiKey),
    hasResendFrom: Boolean(resendFrom),
    hasHtml: Boolean(payload?.html),
    customerEmail: payload?.customer?.email || "UNSET"
  });

  if (!payload) return jsonResponse(400, { ok: false, message: "请求内容不是合法 JSON" });
  if (!confirmationEmailTo) return jsonResponse(500, { ok: false, message: "确认单收件邮箱未配置" });
  if (!isValidEmail(confirmationEmailTo)) return jsonResponse(400, { ok: false, message: "确认单收件邮箱格式不正确" });
  if (payload.customer?.email && !isValidEmail(payload.customer.email)) return jsonResponse(400, { ok: false, message: "客户邮箱格式不正确" });
  if (!resendApiKey || !resendFrom) return jsonResponse(500, { ok: false, message: "Resend 邮件配置缺失" });

  const html = String(payload.html || "");
  if (!html.includes("定制确认单")) return jsonResponse(400, { ok: false, message: "确认单内容不完整" });

  const customerName = String(payload.customer?.name || "customer").trim() || "customer";
  const productName = String(payloadProductName(payload.product)).trim() || "Skate CIM";
  const subject = `${productName} 定制确认单 - ${customerName}`;
  const confirmationAttachment = {
    filename: `${safeFileName(productName)}-${safeFileName(customerName)}-confirmation.html`,
    content: htmlToBase64(html)
  };
  const resendBody = {
    from: resendFrom,
    to: [confirmationEmailTo],
    subject,
    html,
    attachments: [
      confirmationAttachment,
      ...embroideryImageAttachments(payload.embroidery).map((item) => ({ filename: item.filename, content: item.content }))
    ]
  };
  if (payload.customer?.email) resendBody.reply_to = [payload.customer.email];

  const response = await fetchImpl(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(resendBody)
  });
  const result = await response.json().catch(() => ({}));
  console.log("[confirmation-email] Resend response", {
    status: response.status,
    ok: response.ok,
    providerId: result.id || "UNSET",
    providerMessage: result.message || result.error || ""
  });

  if (!response.ok) {
    // Keep the provider message visible in Cloudflare Functions logs without printing the API key.
    console.error("[confirmation-email] Resend send failed", {
      status: response.status,
      to: confirmationEmailTo,
      from: resendFrom,
      subject,
      providerMessage: result.message || result.error || "Resend 发送失败"
    });
    return jsonResponse(response.status, { ok: false, message: result.message || result.error || "Resend 发送失败" });
  }

  return jsonResponse(200, {
    ok: true,
    id: `confirmation-${Date.now()}`,
    providerId: result.id,
    transport: "resend",
    to: confirmationEmailTo
  });
}
