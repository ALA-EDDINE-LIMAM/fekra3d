require('dotenv').config();
const { sendOrderConfirmationEmail, formatFromAddress } = require('./utils/email');

const testEmail = async () => {
  console.log('--- Testing SMTP configuration ---');
  console.log(`From: ${formatFromAddress()}`);
  console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? 'configured' : 'missing'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER ? 'configured' : 'missing'}`);
  console.log('----------------------------------');

  const targetEmail = process.env.TEST_EMAIL || process.env.CONTACT_EMAIL || 'alaeddine.limam@issatm.ucar.tn';

  try {
    console.log('Attempting to send test order confirmation...');
    const info = await sendOrderConfirmationEmail({
      email: targetEmail,
      full_name: 'Client test',
      tracking_code: process.env.TEST_TRACKING_CODE || 'TEST-TRACK-0001',
      total_price: 0,
      items: [
        {
          product_name: 'Test Fekra 3D',
          quantity: 1,
          price: 0,
          customization: { colors: [], material: '' },
        },
      ],
    });
    console.log('Test email sent successfully!');
    console.log('Message ID:', info?.messageId || 'n/a');
  } catch (error) {
    console.error('Error sending test email:', error?.message || error);
  }
};

if (require.main === module) {
  testEmail();
}
