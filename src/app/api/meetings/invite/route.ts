import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, meetingTitle, meetingUrl, senderName } = await req.json();

    if (!email || !meetingTitle || !meetingUrl) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Make Flow IA <onboarding@resend.dev>",
      to: [email],
      subject: `Te invitan a unirte a: ${meetingTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #1a1a1a; color: #ffffff; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px; color: #00a0d1;">Make Flow IA</h2>
            <p style="margin: 8px 0 0; color: #b3b3b3; font-size: 13px;">Plataforma de Videoconferencias</p>
          </div>
          <div style="background: #242424; border-radius: 8px; padding: 24px; border: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0 0 8px; color: #b3b3b3; font-size: 14px;">
              ${senderName || "Alguien"} te invita a unirte a:
            </p>
            <h3 style="margin: 0 0 20px; font-size: 18px; color: #ffffff;">${meetingTitle}</h3>
            <a href="${meetingUrl}" style="display: inline-block; background: #00a0d1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Únete a la reunión
            </a>
            <p style="margin: 16px 0 0; font-size: 12px; color: #6e6e6e;">
              O copia este enlace:<br/>
              <a href="${meetingUrl}" style="color: #00a0d1; word-break: break-all;">${meetingUrl}</a>
            </p>
          </div>
          <p style="text-align: center; margin: 20px 0 0; font-size: 11px; color: #6e6e6e;">
            Make Flow IA — Videoconferencias profesionales
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Error enviando email" }, { status: 500 });
    }

    return NextResponse.json({ data: { id: data?.id } });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
