import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost } from "../functions/api/public/confirmation-email.js";

test("Pages function sends confirmation emails through Resend", async () => {
  const resendRequests = [];
  const response = await onRequestPost({
    env: {
      CONFIRMATION_EMAIL_TO: "orders@example.com",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM: "Skate CIM <orders@example.com>",
      fetch: async (url, options) => {
        resendRequests.push({ url, options, body: JSON.parse(options.body) });
        return new Response(JSON.stringify({ id: "email_test_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    },
    request: new Request("https://freestyle-cim.pages.dev/api/public/confirmation-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: "YJS Pro CIM",
        customer: { name: "测试用户", email: "customer@example.com" },
        embroidery: [
          {
            code: "C",
            name: "鞋舌电绣片",
            image: {
              name: "logo.png",
              type: "image/png",
              dataUrl: "data:image/png;base64,QUJD"
            }
          }
        ],
        html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
      })
    })
  });

  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.transport, "resend");
  assert.equal(result.providerId, "email_test_123");
  assert.equal(result.to, "orders@example.com");
  assert.equal(resendRequests.length, 1);
  assert.equal(resendRequests[0].url, "https://api.resend.com/emails");
  assert.equal(resendRequests[0].options.headers.Authorization, "Bearer re_test_key");
  assert.equal(resendRequests[0].body.from, "Skate CIM <orders@example.com>");
  assert.deepEqual(resendRequests[0].body.to, ["orders@example.com"]);
  assert.deepEqual(resendRequests[0].body.reply_to, ["customer@example.com"]);
  assert.equal(resendRequests[0].body.attachments[0].filename, "YJS Pro CIM-测试用户-confirmation.html");
  assert.equal(resendRequests[0].body.attachments[1].filename, "C-鞋舌电绣片-logo.png");
  assert.equal(resendRequests[0].body.attachments[1].content, "QUJD");
});
