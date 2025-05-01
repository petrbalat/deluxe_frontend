import {assertEquals} from "@std/assert";
import {ImapOptions} from "@workingdevshero/deno-imap";
import {downloadUnreadEmails} from "../../utils/emails.ts";

Deno.test(async function downloadUnreadEmailsTest() {
  const files = await Array.fromAsync(downloadUnreadEmails(testConnection, {decodeBase64: true}));
  console.log(files);
  assertEquals(files.length, 1);
});

const testConnection:ImapOptions = {
  host: Deno.env.get("EMAIL_HOST")! ?? "imap.seznam.cz",
  port: +(Deno.env.get("EMAIL_PORT") ?? "993"),
  tls: (Deno.env.get("EMAIL_TLS") ?? "true") === "true",
  username: Deno.env.get("EMAIL_USER")!,
  password: Deno.env.get("EMAIL_PASSWORD")!,
}
