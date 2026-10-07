/**
 * Lokalni SMTP server SAMO za razvoj: prima poruke kontakt forme i ispisuje ih u terminal,
 * umesto da ih šalje dalje. Ne koristiti u produkciji.
 *
 *   npm run dev:smtp
 *
 * U .env.local podesiti:
 *   SMTP_HOST=127.0.0.1  SMTP_PORT=1025  SMTP_SECURE=false  SMTP_REQUIRE_TLS=false
 *   SMTP_FROM_EMAIL=noreply@registarostavina.rs
 */
import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

const port = Number(process.env.DEV_SMTP_PORT ?? 1025);

const server = new SMTPServer({
  authOptional: true,
  allowInsecureAuth: true,
  disabledCommands: ['STARTTLS'],
  logger: false,
  onAuth(_auth, _session, callback) {
    callback(null, { user: 'dev' });
  },
  async onData(stream, session, callback) {
    try {
      const mail = await simpleParser(stream);
      const to = session.envelope.rcptTo.map((rcpt) => rcpt.address).join(', ');
      console.log('\n──────── Nova poruka (dev SMTP) ────────');
      console.log(`Envelope: ${session.envelope.mailFrom?.address ?? ''} → ${to}`);
      console.log(`From:     ${mail.from?.text ?? ''}`);
      console.log(`Reply-To: ${mail.replyTo?.text ?? ''}`);
      console.log(`Subject:  ${mail.subject ?? ''}\n`);
      console.log(mail.text ?? '');
      callback();
    } catch (error) {
      callback(error);
    }
  },
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dev SMTP server sluša na 127.0.0.1:${port} (poruke se samo ispisuju ovde).`);
});
