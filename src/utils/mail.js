import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Project Manager",
            link: "https://projectmanage.link.com",
        },
    });

    const emailTextual = mailGenerator.generatePlaintext(
        options.mailgenContent,
    );
    const emailHtml = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: "mail.projectmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
        console.log("Email sent to ", options.email);
    } catch (error) {
        console.error(
            "Email service failed silently. Make sure that you have provided your MAILTRAP credentials correctly in the .env file.",
        );
        console.error("Email error: ", error);
    }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our Project Manager App! We're excited to have you on board.",
            action: {
                instructions:
                    "To verify your email, please click on the below button.",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "Need support or have questions Just send us your concern to this email: support@projmanage.com",
        },
    };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset your account's login password.",
            action: {
                instructions:
                    "To reset your password please click on the below button or link.",
                button: {
                    color: "#22BC66",
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need support or have questions Just send us your concern to this email: support@projmanage.com",
        },
    };
};

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
};
