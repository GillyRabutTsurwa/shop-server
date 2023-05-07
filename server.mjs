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
app.use(
    cors({
        origin: CLIENT_URL,
    })
);
dotenv.config();

const stripeProdKey = process.env.STRIPE_PRIVATE_PROD_KEY;
const stripeDevKey = process.env.STRIPE_PRIVATE_TEST_KEY;

const STRIPE_KEY = isProduction ? stripeProdKey : stripeDevKey;

const stripe = new Stripe(STRIPE_KEY);

const products = await fetchProducts();
// console.log(products);

app.get("/products", (req, res) => {
    res.send(products);
});

app.post("/checkout", async (request, response) => {
    // removing this stripe code session below and making it its own variable
    const lineItems = request.body.items.map((currentItem) => {
        const storeItem = products.find((currentProduct) => currentProduct._id === currentItem.id);
        // console.log(urlFor(storeItem.mainImage.asset._ref).options.source);
        // TESTING: working on showing images show in checkout
        const str = storeItem.mainImage.asset._ref;
        console.log(str.slice(6, str.length - 4));
        console.log(urlFor(storeItem.mainImage));
        console.log(urlFor(str));
        const { baseUrl, projectId, dataset, source } = urlFor(str).options;
        console.log(`baseURL: ${baseUrl}`);
        console.log(`projectId: ${projectId}`);
        console.log(`dataset: ${dataset}`);
        console.log(`source: ${source}`);
        console.log(`${baseUrl}/images/${projectId}/${dataset}/${str.slice(6, str.length - 4)}`);
        return {
            price_data: {
                currency: "usd",
                product_data: {
                    name: storeItem.name,
                    // images: [
                    //     "https://plus.unsplash.com/premium_photo-1674147605306-7192b6208609?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                    // ],
                    images: [`${baseUrl}/images/${projectId}/${dataset}/${str.slice(6, str.length - 4)}.jpg`],
                },
                unit_amount: storeItem.price,
            },
            quantity: currentItem.quantity,
        };
    });
    // TESTING
    cart = lineItems;
    // =======================================

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/about`,
            cancel_url: `${process.env.CLIENT_URL}`,
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
});
