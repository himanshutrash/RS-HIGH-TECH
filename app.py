import os
import sqlite3
from datetime import datetime, timezone

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
    """Sends lead email via Resend API (works on Render free tier)."""
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        app.logger.warning("RESEND_API_KEY not set — email skipped")
        return False

    recipient = os.getenv("LEAD_RECIPIENT", "info.rshightech@gmail.com")
    resend.api_key = api_key
    params = resend.Emails.SendParams(
        from_="RS High Tech India <onboarding@resend.dev>",
        to=[recipient],
        subject=f"New website enquiry \u2014 {lead['service'] or 'General'}",
        text=(
            "New enquiry from RS HIGH TECH INDIA website\n\n"
            f"Name    : {lead['name']}\n"
            f"Phone   : {lead['phone']}\n"
            f"Email   : {lead['email'] or 'Not provided'}\n"
            f"Service : {lead['service'] or 'Not specified'}\n"
            f"Message : {lead['message'] or 'No message'}"
        ),
    )
    resend.Emails.send(params)
    app.logger.info("Email sent to %s via Resend", recipient)
    return True



@app.get("/")
def home():
    return render_template("index.html")


@app.get("/test-email")
def test_email():
    """Debug route — visit /test-email to check Resend config."""
    if not os.getenv("RESEND_API_KEY"):
        return jsonify(ok=False, message="RESEND_API_KEY env var is missing"), 500
    try:
        notify_owner({"name": "Test", "phone": "0000000000", "email": "test@test.com",
                      "service": "Test", "message": "Test email from /test-email route"})
        return jsonify(ok=True, message=f"Test email sent to {os.getenv('LEAD_RECIPIENT', 'info.rshightech@gmail.com')}")
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
