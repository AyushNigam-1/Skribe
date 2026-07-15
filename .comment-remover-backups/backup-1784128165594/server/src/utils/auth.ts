import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI as string);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trustedOrigins: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://skribe-workspace.vercel.app"
    ],
    user: {
        additionalFields: {
            username: {
                type: "string",
                required: false,
                unique: true,
            },
            favourites: {
                type: "string[]",
                required: false,
                defaultValue: [],
                input: false,
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const baseUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
                    let finalUsername = baseUsername;
                    let isUnique = false;
                    let counter = 0;
                    while (!isUnique) {
                        const existing = await db.collection("user").findOne({ username: finalUsername });

                        if (!existing) {
                            isUnique = true;
                        } else {
                            counter++;
                            finalUsername = `${baseUsername}${counter}`;
                        }
                    }
                    return {
                        data: {
                            ...user,
                            username: finalUsername,
                        }
                    };
                }
            }
        }
    },

    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, token }) => {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const resetLink = `${frontendUrl}/reset-password?token=${token}`;

            console.log(`[TESTING] Password reset link for ${user.email}: ${resetLink}`);

            try {
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "api-key": process.env.BREVO_API_KEY as string,
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        sender: {
                            email: "ayushnigam843@gmail.com",
                            name: "Skribe Workspace"
                        },
                        to: [{ email: user.email }],
                        subject: "Reset your Skribe password",
                        htmlContent: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #111;">Reset Your Password</h2>
                                <p style="color: #444; line-height: 1.5;">Hi ${user.name || 'there'},</p>
                                <p style="color: #444; line-height: 1.5;">Someone recently requested a password change for your Skrible account. If this was you, you can set a new password here:</p>
                                
                                <div style="margin: 30px 0;">
                                    <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                        Reset Password
                                    </a>
                                </div>
    
                                <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                            </div>
                        `
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
                }

                console.log(`[SUCCESS] Reset email sent to ${user.email} via Brevo`);
            } catch (error) {
                console.error("[ERROR] Failed to send password reset email:", error);
            }
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
        }
    }
});