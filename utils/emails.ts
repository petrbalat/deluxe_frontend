import {
  fetchUnreadMessages,
  markMessagesAsRead,
  ImapClient,
  type ImapMessage,
  type ImapOptions,
} from "@workingdevshero/deno-imap";
import {decodeBase64} from "@std/encoding";

/**
 * download unread emails and mark them as read
 * @param imapConnection
 * @param options
 */
export async function* downloadUnreadEmails(imapConnection: ImapOptions, options?: EmailOptions): AsyncGenerator<EmailContent, void, unknown> {
  const client = new ImapClient(imapConnection);
  await client.connect();
  await client.authenticate();
  const decoder = new TextDecoder();

  try {
    const messages: ImapMessage[] = await fetchUnreadMessages(client, "INBOX", {
      uid: true,
      full: true,
      envelope: true,
      internalDate: true,
      bodyParts: ["TEXT"],
    });

    let messagesToProcess = messages;
    if (options?.uidFilter) {
      messagesToProcess = messages.filter((it) => !options.uidFilter!.includes(it.uid!.toString()));
    }

    // pouze
    for (const message of messagesToProcess) {
      let content= decoder.decode(message.parts!.TEXT.data)
        .trim();

      if (options?.decodeBase64) {
        content = content.replace(/BODY\[\]\s+\{\d+\}$/i, '').trim();
        content = decoder.decode(decodeBase64(content))
      }

      yield {
        content,
        subject: message.envelope?.subject,
        uid: message.uid!,
        date: message.internalDate,
      };
    }

    await markMessagesAsRead(
      client,
      'INBOX',
      messages.map(it => it.uid ?? 0).filter(it => it > 0),
      true,
    );
  } finally {
    client.disconnect();
  }
}



export type EmailOptions = {
  uidFilter?: Array<string>
  decodeBase64?: boolean
};


export type EmailContent = {
  subject?: string;
  content: string;
  uid: number;
  date?: Date;
};

