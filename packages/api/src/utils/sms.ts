/**
 * Utility to send SMS via SMS Fortius
 * API URL: http://smsfortius.in/V2/apikey.php
 */

export async function sendOtpSms(mobile: string, otp: string) {
  // Set these in your environment variables (.env)
  const apiKey = process.env.SMS_API_KEY || 'YOUR_API_KEY_HERE';
  const senderId = process.env.SMS_SENDER_ID || 'YOUR_SENDER_ID';
  const templateId = process.env.SMS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID_HERE';
  
  // Create your message template here
  // Ensure the message strictly matches the approved DLT template
  const message = `Verify your account using the code: ${otp}. Enjoy a seamless shopping experience. - CLICKIT E-COMMERCE`;

  // Construct URL based on smsfortius.in API requirements
  const url = new URL('http://smsfortius.in/V2/apikey.php');
  url.searchParams.append('apikey', apiKey);
  url.searchParams.append('senderid', senderId);
  url.searchParams.append('number', mobile);
  url.searchParams.append('message', message);
  url.searchParams.append('templateid', templateId);

  if (!process.env.SMS_API_KEY) {
    console.log(`[DEV SMS] To: ${mobile} | OTP: ${otp} | URL: ${url.toString()}`);
    return;
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.text();
    console.log(`SMS Sent to ${mobile}. Response:`, data);
  } catch (error) {
    console.error('Error sending SMS via smsfortius:', error);
  }
}
