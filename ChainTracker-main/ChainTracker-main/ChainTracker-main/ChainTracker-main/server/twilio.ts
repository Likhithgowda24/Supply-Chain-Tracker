// Twilio SMS integration for sending OTP to phone numbers
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets

export async function sendOTPSMS(to: string, otp: string, username: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.log(`SMS sending not configured. OTP for ${to}: ${otp}`);
    throw new Error('Twilio credentials not configured. Please set up TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets.');
  }

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const message = `Hello ${username},\n\nYour Supply Chain Tracker OTP code is: ${otp}\n\nThis code expires in 5 minutes.`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: twilioPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio error:', error);
      throw new Error('Failed to send SMS');
    }

    const data = await response.json();
    console.log(`OTP SMS sent to ${to}, SID: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw error;
  }
}
