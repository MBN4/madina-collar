import axios from 'axios';

export const sendWhatsAppOTP = async (phone, otpCode) => {
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '92' + formattedPhone.substring(1);
  }

  if (process.env.WHATSAPP_PROVIDER === 'meta') {
    const url = `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: process.env.META_TEMPLATE_NAME || 'otp_verification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: otpCode }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: otpCode }
            ]
          }
        ]
      }
    };

    try {
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      throw new Error('Failed to send WhatsApp message via Meta');
    }
  }

  else if (process.env.WHATSAPP_PROVIDER === 'ultramsg') {
    const url = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`;
    const payload = {
      token: process.env.ULTRAMSG_TOKEN,
      to: `+${formattedPhone}`,
      body: `Your Madina Collar verification code is: *${otpCode}*. It expires in 1 minute.`
    };

    try {
      await axios.post(url, payload);
    } catch (err) {
      throw new Error('Failed to send WhatsApp message via UltraMsg');
    }
  }
};