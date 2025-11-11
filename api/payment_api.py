from fastapi import APIRouter, Request, UploadFile, Form
from fastapi.responses import JSONResponse
import os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

router = APIRouter()

UPI_ID = "8010407897@yapl"
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "karankundle4@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "jkjy ojcn tjbk xqdy")
ADMIN_EMAIL = os.getenv("ADMIN_NOTIFY_EMAIL", SMTP_USER)


def send_email_with_attachment(to_email: str, subject: str, html: str, file: UploadFile = None):
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    msg.attach(MIMEText(html, "html"))

    # ✅ Attach proof image
    if file:
        content = file.file.read()
        attachment = MIMEApplication(content, _subtype="png")
        attachment.add_header("Content-Disposition", "attachment", filename=file.filename)
        msg.attach(attachment)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(SMTP_USER, [to_email], msg.as_string())


@router.post("/api/save")
async def save(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    senderNumber: str = Form(...),
    role: str = Form(...),
    skills: str = Form(""),
    projects: str = Form(""),
    achievements: str = Form(""),
    paymentProof: UploadFile = None,
):
    html = f"""
    <h2>📩 New Resume Request Received (Pending Verification)</h2>
    <p><b>Payment Receiver UPI:</b> {UPI_ID}</p>
    <p><b>Sender UPI Mobile Number:</b> {senderNumber}</p>
    <hr>
    <p><b>Name:</b> {name}</p>
    <p><b>Email:</b> {email}</p>
    <p><b>Phone:</b> {phone}</p>
    <p><b>Desired Role:</b> {role}</p>
    <p><b>Skills:</b><br>{skills}</p>
    <p><b>Projects:</b><br>{projects}</p>
    <p><b>Achievements:</b><br>{achievements}</p>
    <hr>
    <p style="color:gray;">📎 Payment screenshot attached (if uploaded).</p>
    """

    send_email_with_attachment(ADMIN_EMAIL, "✅ New Resume Payment (Proof Attached)", html, paymentProof)
    return JSONResponse({"ok": True, "msg": "Details received successfully, proof attached."})
