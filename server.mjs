import fetchProducts, { client } from "./sanity.mjs"; //NOTE: will need client later when subscribing to my project data
import imageUrlBuilder from "@sanity/image-url";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

const app = express();
const PORT = process.env.PORT || 4242;
const builder = imageUrlBuilder(client); // NOTE: using client earlier than expected

function urlFor(source) {
    return builder.image(source);
}

const isProduction = process.env.NODE_ENV === "production";

const clientProdUrl = process.env.CLIENT_PROD_URL;
const clientDevUrl = process.env.CLIENT_DEV_URL;
const CLIENT_URL = isProduction ? clientProdUrl : clientDevUrl;

app.use(express.json());
app.use(express.static("public"));
app.use(
    cors({
        origin: CLIENT_URL,
    })
);
dotenv.config();

const stripeProdKey = process.env.STRIPE_PRIVATE_PROD_KEY;
const stripeDevKey = process.env.STRIPE_PRIVATE_TEST_KEY;

const STRIPE_SECRET_KEY = isProduction ? stripeProdKey : stripeDevKey;
const stripe = new Stripe(STRIPE_SECRET_KEY);
const products = await fetchProducts();

app.get("/products", (req, res) => {
    res.send(products);
});

app.post("/checkout", async (request, response) => {
    // removing this stripe code session below and making it its own variable
    const lineItems = request.body.items.map((currentItem) => {
        const storeItem = products.find((currentProduct) => currentProduct._id === currentItem.id);
        const str = storeItem.mainImage.asset._ref;
        const { baseUrl, projectId, dataset, source } = urlFor(str).options;
        return {
            price_data: {
                currency: "usd",
                product_data: {
                    name: storeItem.name,
                    images: [`${baseUrl}/images/${projectId}/${dataset}/${str.slice(6, str.length - 4)}.jpg`],
                },
                unit_amount: storeItem.price,
            },
            quantity: currentItem.quantity,
        };
    });

    // =======================================

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            success_url: `${CLIENT_URL}/success`,
            cancel_url: `${CLIENT_URL}`,
        });
        response.json({ url: session.url });
        // return response.send({ url: session.url });
    } catch (err) {
        response.status(500).json({
            error: err.message,
        });
        console.log(err);
    }
});

//NOTE: make our application work
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
    console.log(`Current Client is ${CLIENT_URL}`);
});
