const https = require('https');
const { URL } = require('url');
const nodemailer = require('nodemailer');

const isSmtpAuthError = (error) => error && (error.code === 'EAUTH' || error.responseCode === 535);

const parseAddressIdentity = (value, fallbackName = 'Fekra 3D', fallbackEmail = '') => {
  const address = value ? String(value).trim() : '';

  if (!address) {
    return {
      name: fallbackName,
      email: fallbackEmail,
    };
  }

  const match = address.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1].trim() || fallbackName,
      email: match[2].trim() || fallbackEmail,
    };
  }

  if (address.includes('@')) {
    return {
      name: fallbackName,
      email: address,
    };
  }

  return {
    name: address || fallbackName,
    email: fallbackEmail,
  };
};

const getSenderIdentity = () => {
  const smtpUser = process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : '';
  const smtpFrom = process.env.SMTP_FROM ? String(process.env.SMTP_FROM).trim() : '';
  const apiSenderEmail = process.env.BREVO_SENDER_EMAIL ? String(process.env.BREVO_SENDER_EMAIL).trim() : '';
  const apiSenderName = process.env.BREVO_SENDER_NAME ? String(process.env.BREVO_SENDER_NAME).trim() : 'Fekra 3D';
  const parsedFrom = parseAddressIdentity(smtpFrom, apiSenderName, apiSenderEmail || smtpUser);

  if (parsedFrom.email) {
    return parsedFrom;
  }

  if (apiSenderEmail) {
    return {
      name: apiSenderName,
      email: apiSenderEmail,
    };
  }

  if (smtpUser) {
    return {
      name: apiSenderName,
      email: smtpUser,
    };
  }

  return {
    name: 'Fekra 3D',
    email: 'fekra3d.printing@gmail.com',
  };
};

const formatReplyToAddress = () => {
  const replyToSource = process.env.BREVO_REPLY_TO || process.env.SMTP_FROM || '';
  const sender = getSenderIdentity();
  const replyTo = parseAddressIdentity(replyToSource, sender.name, sender.email);

  if (!replyTo.email) {
    return undefined;
  }

  return replyTo;
};

const formatFromAddress = () => {
  const sender = getSenderIdentity();
  return `"${sender.name}" <${sender.email}>`;
};

const getBrevoApiKey = () => {
  const candidates = [
    process.env.BREVO_API_KEY,
    process.env.BREVO_API_V3_KEY,
    process.env.API_V3_KEY,
    process.env.BREVO_KEY,
  ];

  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  
  if (process.env.SMTP_PASS && String(process.env.SMTP_PASS).startsWith('xsmtpsib-')) {
    return String(process.env.SMTP_PASS).trim();
  }

  return '';
};

const postJson = (requestUrl, headers, body) => new Promise((resolve, reject) => {
  const parsedUrl = new URL(requestUrl);
  const payload = JSON.stringify(body);

  const request = https.request({
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: `${parsedUrl.pathname}${parsedUrl.search}`,
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (response) => {
    let responseBody = '';

    response.on('data', (chunk) => {
      responseBody += chunk;
    });

    response.on('end', () => {
      const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
      let parsedBody = responseBody;

      try {
        parsedBody = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        parsedBody = responseBody;
      }

      if (isSuccess) {
        resolve(parsedBody);
        return;
      }

      const error = new Error(typeof parsedBody === 'object' && parsedBody && parsedBody.message
        ? parsedBody.message
        : `Brevo API request failed with status ${response.statusCode}`);
      error.statusCode = response.statusCode;
      error.responseBody = parsedBody;
      reject(error);
    });
  });

  request.on('error', reject);
  request.write(payload);
  request.end();
});

const parseCustomization = (customization) => {
  if (!customization) return { colors: [], material: '' };

  if (typeof customization === 'string') {
    try {
      return parseCustomization(JSON.parse(customization));
    } catch {
      return { colors: [], material: '' };
    }
  }

  return {
    colors: Array.isArray(customization.colors) ? customization.colors.filter(Boolean) : [],
    material: customization.material ? String(customization.material) : '',
  };
};

const describeCustomization = (customization) => {
  const parsed = parseCustomization(customization);
  const labels = [];

  if (parsed.colors.length > 0) {
    labels.push(`Couleur${parsed.colors.length > 1 ? 's' : ''} : ${parsed.colors.join(', ')}`);
  }

  if (parsed.material) {
    labels.push(`Matériau : ${parsed.material}`);
  }

  return labels;
};

const createBrevoTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error('Configuration SMTP manquante: SMTP_USER et SMTP_PASS sont obligatoires.');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const verifyTransporter = async (transporter) => {
  await transporter.verify();
};

const sendViaBrevoApi = async ({ to, subject, html, text, replyTo }) => {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    return null;
  }

  const sender = getSenderIdentity();
  const recipient = typeof to === 'string' ? { email: to } : to;
  const payload = {
    sender: {
      name: sender.name,
      email: sender.email,
    },
    to: [recipient],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {}),
    ...(replyTo ? { replyTo } : {}),
  };

  return postJson('https://api.brevo.com/v3/smtp/email', {
    accept: 'application/json',
    'api-key': apiKey,
  }, payload);
};

const sendViaSmtp = async ({ to, subject, html, text, replyTo }) => {
  const transporter = createBrevoTransporter();
  await verifyTransporter(transporter);

  return transporter.sendMail({
    from: formatFromAddress(),
    replyTo,
    to: typeof to === 'string' ? to : to.email,
    subject,
    html,
    text,
  });
};

const sendTransactionalEmail = async (payload) => {
  const apiKey = getBrevoApiKey();
  if (apiKey) {
    return sendViaBrevoApi(payload);
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendViaSmtp(payload);
  }

  throw new Error('No email transport is configured. Set BREVO_API_KEY or SMTP_USER/SMTP_PASS.');
};

const buildOrderTextBody = (order) => {
  const itemLines = order.items.map((item) => {
    const customizationParts = describeCustomization(item.customization);
    const customizationText = customizationParts.length > 0 ? ` | ${customizationParts.join(' | ')}` : '';
    return `- ${item.product_name || 'Produit'} x${item.quantity} (${Number(item.price).toFixed(3)} TND)${customizationText}`;
  }).join('\n');

  return [
    'Merci pour votre commande chez Fekra 3D !',
    '',
    `Bonjour ${order.full_name},`,
    'Nous avons bien reçu votre commande et nous la préparons avec soin.',
    '',
    `Code client : ${order.tracking_code}`,
    `Suivi : ${(process.env.FRONTEND_URL || 'http://localhost:5173')}/suivi`,
    '',
    'Détails de vos achats :',
    itemLines,
    '',
    `Total : ${Number(order.total_price).toFixed(3)} TND`,
  ].join('\n');
};

const sendOrderConfirmationEmail = async (order) => {
  if (!order.email) return;

  try {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; vertical-align: middle; margin-right: 10px;"/>` : ''}
          ${item.product_name || 'Produit'}
          ${describeCustomization(item.customization).length > 0 ? `<div style="margin-top: 4px; font-size: 12px; color: #666;">${describeCustomization(item.customization).join('<br/>')}</div>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toFixed(3)} TND</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #47d7c6;">Merci pour votre commande chez Fekra 3D !</h2>
        <p>Bonjour ${order.full_name},</p>
        <p>Nous avons bien reçu votre commande et nous la préparons avec soin.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Code client : <span style="color: #47d7c6;">${order.tracking_code}</span></h3>
          <p>Ce code vous permet de consulter l'état de votre commande à tout moment dans la page <strong>Suivi de commande</strong>.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/suivi" style="display: inline-block; background-color: #47d7c6; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Suivre ma commande</a>
        </div>

        <h3 style="border-bottom: 2px solid #47d7c6; padding-bottom: 5px;">Détails de vos achats</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="padding: 10px; text-align: left;">Produit</th>
              <th style="padding: 10px; text-align: left;">Quantité</th>
              <th style="padding: 10px; text-align: right;">Prix Unitaire</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <p style="font-size: 18px; text-align: right;"><strong>Total : ${order.total_price.toFixed(3)} TND</strong></p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">
          Fekra 3D - Impression 3D sur mesure<br/>
          Si vous avez des questions, répondez simplement à cet email.
        </p>
      </div>
    `;

    const info = await sendTransactionalEmail({
      to: order.email,
      subject: `Votre commande Fekra 3D est confirmée (N° ${order.tracking_code})`,
      html: htmlContent,
      text: buildOrderTextBody(order),
      replyTo: formatReplyToAddress(),
    });

    console.log('Order confirmation email delivery status:', {
      to: order.email,
      from: formatFromAddress(),
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    });

    return info;
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.warn('SMTP authentication failed for order confirmation email. Configure a valid Brevo API key (BREVO_API_KEY, BREVO_API_V3_KEY, API_V3_KEY) or fix SMTP_USER/SMTP_PASS.');
      return null;
    }

    console.error('Error sending order confirmation email:', error?.message || error);
    return null;
  }
};

const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #47d7c6;">Nouveau message de contact - Fekra3D</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Sujet :</strong> ${subject || 'Aucun sujet'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3>Message :</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </body>
      </html>
    `;

    await sendTransactionalEmail({
      to: process.env.CONTACT_EMAIL || 'fekra3d.printing@gmail.com',
      replyTo: `"${name}" <${email}>`,
      subject: `[Formulaire Contact] ${subject || 'Nouveau message'}`,
      html: htmlContent,
      text: `Nouveau message de contact - Fekra3D\n\nNom : ${name}\nEmail : ${email}\nSujet : ${subject || 'Aucun sujet'}\n\nMessage :\n${message}`,
    });

    console.log('Contact email sent successfully to configured inbox.');
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.warn('SMTP authentication failed for contact email. Configure a valid Brevo API key (BREVO_API_KEY, BREVO_API_V3_KEY, API_V3_KEY) or fix SMTP_USER/SMTP_PASS.');
      return null;
    }

    console.error('Error sending contact email:', error?.message || error);
    return null;
  }
};

module.exports = {
  formatFromAddress,
  sendOrderConfirmationEmail,
  sendContactEmail
};
