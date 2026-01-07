import sgMail from '@sendgrid/mail';

export async function getUncachableSendGridClient() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid credentials not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL secrets.');
  }

  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: fromEmail
  };
}

export async function sendOTPEmail(to: string, otp: string, username: string) {
  try {
    const {client, fromEmail} = await getUncachableSendGridClient();
    
    console.log(`📧 Attempting to send OTP email...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${to}`);
    console.log(`   OTP: ${otp}`);
    
    const msg = {
      to,
      from: fromEmail,
      subject: 'Your Supply Chain Tracker OTP Code',
      text: `Hello ${username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nSupply Chain Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-bottom: 20px;">Supply Chain Tracker</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="color: #666; font-size: 14px; margin: 20px 0;">Your one-time password (OTP) code is:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin: 20px 0;">This code will expire in <strong>5 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const response = await client.send(msg);
    console.log(`✅ OTP email sent successfully to ${to}`);
    console.log(`   SendGrid response:`, response[0].statusCode, response[0].headers);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error);
    if (error.response) {
      console.error('   SendGrid error response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    throw error;
  }
}

export async function sendOrderAssignmentEmail(to: string, supplierName: string, orderDetails: any, manufacturerName: string) {
  try {
    const {client, fromEmail} = await getUncachableSendGridClient();
    
    console.log(`📧 Attempting to send order assignment email...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${to}`);
    console.log(`   Order: ${orderDetails.orderId}`);
    
    const msg = {
      to,
      from: fromEmail,
      subject: `New Order Assignment - ${orderDetails.productName}`,
      text: `Hello ${supplierName},\n\nYou have been assigned a new order by ${manufacturerName}.\n\nOrder Details:\n- Order ID: ${orderDetails.orderId}\n- Product: ${orderDetails.productName}\n- Customer: ${orderDetails.customerName}\n- Quantity: ${orderDetails.quantity} units\n- Unit Price: ₹${orderDetails.productPrice}\n- Total Price: ₹${orderDetails.totalPrice}\n- Status: ${orderDetails.status}\n\nPlease log in to Supply Chain Tracker to view more details and manage this order.\n\nBest regards,\nSupply Chain Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-bottom: 10px;">Supply Chain Tracker</h2>
            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">New Order Assignment</p>
            
            <p style="color: #333; font-size: 16px;">Hello <strong>${supplierName}</strong>,</p>
            <p style="color: #666; font-size: 14px; margin: 20px 0;">You have been assigned a new order by <strong>${manufacturerName}</strong>.</p>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Order Details</h3>
              <table style="width: 100%; font-size: 14px; color: #333;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
                  <td style="padding: 8px 0; color: #667eea;">${orderDetails.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Product:</td>
                  <td style="padding: 8px 0;">${orderDetails.productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
                  <td style="padding: 8px 0;">${orderDetails.customerName} (${orderDetails.customerEmail})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Quantity:</td>
                  <td style="padding: 8px 0;">${orderDetails.quantity} units</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Unit Price:</td>
                  <td style="padding: 8px 0;">₹${orderDetails.productPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                  <td style="padding: 8px 0; color: #667eea; font-size: 16px; font-weight: bold;">₹${orderDetails.totalPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; background: #ffc107; color: white; padding: 4px 8px; border-radius: 4px; display: inline-block;">${orderDetails.status}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">Please log in to Supply Chain Tracker to view more details and manage this order.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              This is an automated notification from Supply Chain Tracker. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const response = await client.send(msg);
    console.log(`✅ Order assignment email sent successfully to ${to}`);
    console.log(`   SendGrid response:`, response[0].statusCode, response[0].headers);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending order assignment email:', error);
    if (error.response) {
      console.error('   SendGrid error response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    throw error;
  }
}
