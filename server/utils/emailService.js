import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.EMAIL_USER;

    const payload = {
        sender: {
            name: 'Arogya Portal',
            email: SENDER_EMAIL
        },
        to: [{
            email: options.email,
            name: options.name || 'Patient'
        }],
        subject: options.subject,
        htmlContent: options.html || options.message
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Brevo Error:', data);
            throw new Error(data.message || 'Failed to send email');
        }

        console.log('✅ Email sent to:', options.email);
        return { success: true, messageId: data.messageId };

    } catch (error) {
        console.error('❌ Email Error:', error.message);
        return { success: false, error: error.message };
    }
};

export default sendEmail;
