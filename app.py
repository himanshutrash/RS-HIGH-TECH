import os
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage

import resend
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_from_directory

load_dotenv()  # loads .env file when running locally
resend.api_key = os.getenv("RESEND_API_KEY", "")

app = Flask(__name__)
app.config["DATABASE"] = os.path.join(app.root_path, "leads.db")


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, "static", "media"), "logo.png", mimetype="image/png")


def init_db():
    with sqlite3.connect(app.config["DATABASE"]) as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
                service TEXT, message TEXT, created_at TEXT NOT NULL
            )"""
        )


def notify_owner(lead):
    """Sends lead email via Resend API or SMTP fallback."""
    recipient = os.getenv("LEAD_RECIPIENT", "info.rshightech@gmail.com")
    
    # Method 1: Resend API
    api_key = os.getenv("RESEND_API_KEY", "")
    if api_key:
        try:
            resend.api_key = api_key
            params = {
                "from": "RS High Tech India <onboarding@resend.dev>",
                "to": [recipient],
                "subject": f"New website enquiry — {lead['service'] or 'General'}",
                "text": (
                    "New enquiry from RS HIGH TECH INDIA website\n\n"
                    f"Name    : {lead['name']}\n"
                    f"Phone   : {lead['phone']}\n"
                    f"Email   : {lead['email'] or 'Not provided'}\n"
                    f"Service : {lead['service'] or 'Not specified'}\n"
                    f"Message : {lead['message'] or 'No message'}"
                ),
            }
            resend.Emails.send(params)
            app.logger.info("Email sent to %s via Resend API", recipient)
            return True
        except Exception as err:
            app.logger.warning("Resend API failed: %s. Attempting SMTP fallback...", err)

    # Method 2: SMTP Fallback (e.g. Gmail SMTP with App Password)
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    if all((host, username, password)):
        msg = EmailMessage()
        msg["Subject"] = f"New website enquiry — {lead['service'] or 'General'}"
        msg["From"] = os.getenv("SMTP_FROM", username)
        msg["To"] = recipient
        msg.set_content(
            "New enquiry from RS HIGH TECH INDIA website\n\n"
            f"Name    : {lead['name']}\n"
            f"Phone   : {lead['phone']}\n"
            f"Email   : {lead['email'] or 'Not provided'}\n"
            f"Service : {lead['service'] or 'Not specified'}\n"
            f"Message : {lead['message'] or 'No message'}"
        )
        port = int(os.getenv("SMTP_PORT", "587"))
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)
        app.logger.info("Email sent to %s via SMTP", recipient)
        return True

    app.logger.warning("Neither RESEND_API_KEY nor full SMTP environment variables are configured.")
    return False


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/test-email")
def test_email():
    """Debug route — visit /test-email to check Resend / SMTP config."""
    resend_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    
    if not resend_key and not (smtp_host and smtp_user and smtp_pass):
        return jsonify(
            ok=False, 
            message="No email credentials configured. Please set RESEND_API_KEY or (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD)."
        ), 500
    try:
        sent = notify_owner({"name": "Test User", "phone": "9999999999", "email": "test@example.com",
                             "service": "Test", "message": "Test email from /test-email route"})
        if sent:
            return jsonify(ok=True, message=f"Test email sent successfully to {os.getenv('LEAD_RECIPIENT', 'info.rshightech@gmail.com')}")
        else:
            return jsonify(ok=False, message="Email could not be sent. Check server logs."), 500
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500




@app.post("/api/lead")
def create_lead():
    data = request.get_json(silent=True) or request.form
    lead = {key: str(data.get(key, "")).strip() for key in ("name", "phone", "email", "service", "message")}
    if len(lead["name"]) < 2 or len(lead["phone"]) < 8:
        return jsonify(ok=False, message="Please enter your name and a valid phone number."), 400

    with sqlite3.connect(app.config["DATABASE"]) as conn:
        conn.execute(
            "INSERT INTO leads (name, phone, email, service, message, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (*lead.values(), datetime.now(timezone.utc).isoformat()),
        )
    try:
        notify_owner(lead)
    except Exception as error:
        app.logger.error("Lead saved but notification could not be sent: %s", error)
    return jsonify(ok=True, message="Thank you. Our team will contact you shortly.")


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
