import {
  fetchUnreadMessages,
  ImapClient,
  type ImapMessage,
  type ImapOptions,
  markMessagesAsRead
} from "@workingdevshero/deno-imap";

/**
 * download unread emails and mark them as read
 * @param imapConnection
 * @param filter
 */
export async function* downloadUnreadEmails(imapConnection: ImapOptions, filter?: EmailFilter): AsyncGenerator<EmailContent, void, unknown> {
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
    if (filter?.uid) {
      messagesToProcess = messages.filter((it) => !filter.uid!.includes(it.uid!.toString()));
    }

    // pouze
    for (const message of messagesToProcess) {
      const content= decoder.decode(message.parts!.TEXT.data);
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



export type EmailFilter = {
  uid?: Array<string>
};


export type EmailContent = {
  subject?: string;
  content: string;
  uid: number;
  date?: Date;
};

