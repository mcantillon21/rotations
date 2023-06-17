import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";

export async function POST (request) {
    const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);
    let data = await request.json();
    let priceId = data.priceId;
    let email = data.email; // Add this line to get the email from the request data
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        customer_email: email, // Add this line to set the email in the session
        mode: 'subscription',
        // success_url: `http://localhost:3000/?access_token=${data.accessToken}`,
        // cancel_url: `http://localhost:3000/?access_token=${data.accessToken}`
        success_url: `http://rotations.ai/?access_token=${data.accessToken}`,
        cancel_url: `http://rotations.ai/?access_token=${data.accessToken}`
    })

    return NextResponse.json(session.url)
}