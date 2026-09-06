import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

export interface ListingEmailData {
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  listingUrl: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
}

export interface OfferEmailData {
  propertyTitle: string;
  propertyAddress: string;
  offerAmount: number;
  buyerName: string;
  sellerName: string;
  offerUrl: string;
  expiryDate: string;
  status: "new" | "accepted" | "rejected" | "countered";
}

export interface AppointmentEmailData {
  propertyTitle: string;
  propertyAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  agentName: string;
  agentPhone: string;
  clientName: string;
  meetingType: "in-person" | "virtual" | "phone";
  meetingUrl?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const recipients = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@airealestate.com",
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function renderListingEmail(data: ListingEmailData): EmailOptions {
  const subject = `New Listing: ${data.propertyTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .property-image { width: 100%; height: 300px; object-fit: cover; }
        .property-title { font-size: 22px; font-weight: bold; color: #333; margin: 15px 0 5px; }
        .property-address { color: #666; font-size: 14px; margin-bottom: 15px; }
        .price { font-size: 28px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .features { display: flex; gap: 20px; margin: 15px 0; }
        .feature { text-align: center; }
        .feature-value { font-size: 18px; font-weight: bold; color: #333; }
        .feature-label { font-size: 12px; color: #666; }
        .cta-button { display: block; width: 100%; padding: 15px; background: #667eea; color: white; text-decoration: none; text-align: center; font-weight: bold; border-radius: 5px; margin: 20px 0; }
        .agent-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Property Listing</h1>
        </div>
        <div class="content">
          <img src="${data.propertyImage}" alt="${data.propertyTitle}" class="property-image" />
          <h2 class="property-title">${data.propertyTitle}</h2>
          <p class="property-address">${data.propertyAddress}</p>
          <div class="price">$${data.price.toLocaleString()}</div>
          <div class="features">
            <div class="feature">
              <div class="feature-value">${data.bedrooms}</div>
              <div class="feature-label">Bedrooms</div>
            </div>
            <div class="feature">
              <div class="feature-value">${data.bathrooms}</div>
              <div class="feature-label">Bathrooms</div>
            </div>
            <div class="feature">
              <div class="feature-value">${data.squareFeet.toLocaleString()}</div>
              <div class="feature-label">Sq Ft</div>
            </div>
          </div>
          <a href="${data.listingUrl}" class="cta-button">View Listing</a>
          <div class="agent-info">
            <strong>Listed by:</strong> ${data.agentName}<br>
            <strong>Email:</strong> ${data.agentEmail}<br>
            <strong>Phone:</strong> ${data.agentPhone}
          </div>
        </div>
        <div class="footer">
          <p>This email was sent from AI Real Estate Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: "",
    subject,
    html,
    text: `${data.propertyTitle} - $${data.price.toLocaleString()} - ${data.propertyAddress}`,
  };
}

export function renderOfferEmail(data: OfferEmailData): EmailOptions {
  const statusText =
    data.status === "new"
      ? "New Offer Received"
      : data.status === "accepted"
      ? "Offer Accepted"
      : data.status === "rejected"
      ? "Offer Declined"
      : "Offer Countered";

  const subject = `${statusText}: ${data.propertyTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { padding: 20px; text-align: center; }
        .header.new { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .header.accepted { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }
        .header.rejected { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); }
        .header.countered { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); }
        .header h1 { margin: 0; font-size: 24px; color: white; }
        .content { padding: 20px; }
        .offer-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .offer-amount { font-size: 28px; font-weight: bold; color: #333; text-align: center; margin: 10px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .cta-button { display: block; width: 100%; padding: 15px; background: #667eea; color: white; text-decoration: none; text-align: center; font-weight: bold; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header ${data.status}">
          <h1>${statusText}</h1>
        </div>
        <div class="content">
          <h2>${data.propertyTitle}</h2>
          <p style="color: #666;">${data.propertyAddress}</p>
          <div class="offer-details">
            <div class="offer-amount">$${data.offerAmount.toLocaleString()}</div>
            <div class="detail-row">
              <span>Buyer:</span>
              <span>${data.buyerName}</span>
            </div>
            <div class="detail-row">
              <span>Seller:</span>
              <span>${data.sellerName}</span>
            </div>
            <div class="detail-row">
              <span>Expires:</span>
              <span>${data.expiryDate}</span>
            </div>
          </div>
          <a href="${data.offerUrl}" class="cta-button">View Offer Details</a>
        </div>
        <div class="footer">
          <p>This email was sent from AI Real Estate Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: "",
    subject,
    html,
    text: `${statusText}: ${data.propertyTitle} - $${data.offerAmount.toLocaleString()}`,
  };
}

export function renderAppointmentEmail(data: AppointmentEmailData): EmailOptions {
  const subject = `Appointment Confirmation: ${data.propertyTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .appointment-card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0; }
        .date-time { font-size: 24px; font-weight: bold; color: #333; text-align: center; margin: 10px 0; }
        .meeting-type { text-align: center; margin: 10px 0; }
        .meeting-badge { display: inline-block; padding: 5px 15px; background: #e0e0e0; border-radius: 20px; font-size: 14px; }
        .details { margin-top: 15px; }
        .detail-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .cta-button { display: block; width: 100%; padding: 15px; background: #9C27B0; color: white; text-decoration: none; text-align: center; font-weight: bold; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed</h1>
        </div>
        <div class="content">
          <div class="appointment-card">
            <div class="date-time">${data.appointmentDate}<br>${data.appointmentTime}</div>
            <div class="meeting-type">
              <span class="meeting-badge">${data.meetingType}</span>
            </div>
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">Property:</span> ${data.propertyTitle}
              </div>
              <div class="detail-item">
                <span class="detail-label">Address:</span> ${data.propertyAddress}
              </div>
              <div class="detail-item">
                <span class="detail-label">Agent:</span> ${data.agentName}
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span> ${data.agentPhone}
              </div>
            </div>
          </div>
          ${
            data.meetingUrl
              ? `<a href="${data.meetingUrl}" class="cta-button">Join Virtual Meeting</a>`
              : ""
          }
        </div>
        <div class="footer">
          <p>This email was sent from AI Real Estate Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: "",
    subject,
    html,
    text: `Appointment: ${data.propertyTitle} on ${data.appointmentDate} at ${data.appointmentTime}`,
  };
}

export async function sendListingEmail(
  to: string | string[],
  data: ListingEmailData
): Promise<boolean> {
  const email = renderListingEmail(data);
  return sendEmail({ ...email, to });
}

export async function sendOfferEmail(
  to: string | string[],
  data: OfferEmailData
): Promise<boolean> {
  const email = renderOfferEmail(data);
  return sendEmail({ ...email, to });
}

export async function sendAppointmentEmail(
  to: string | string[],
  data: AppointmentEmailData
): Promise<boolean> {
  const email = renderAppointmentEmail(data);
  return sendEmail({ ...email, to });
}

export async function sendBulkEmail(
  recipients: string[],
  options: Omit<EmailOptions, "to">
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const success = await sendEmail({ ...options, to: recipient });
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export default {
  sendEmail,
  sendListingEmail,
  sendOfferEmail,
  sendAppointmentEmail,
  sendBulkEmail,
  renderListingEmail,
  renderOfferEmail,
  renderAppointmentEmail,
};
