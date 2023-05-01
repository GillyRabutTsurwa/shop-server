import fetchProducts from "./sanity.mjs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

const app = express();
const PORT = 4242;

app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const products = await fetchProducts();
console.log(products);

//NOTE: unfinished code from here...
const USER_SHOPPING_CART = products;

app.get("/shopping-cart", (req, res) => {
    res.send(USER_SHOPPING_CART);
});

app.post("/checkout", async (request, response) => {
    // removing this stripe code session below and making it its own variable
    const lineItems = request.body.items.map((currentItem) => {
        const storeItem = products.find((currentProduct) => currentProduct._id === currentItem.id);
        return {
            price_data: {
                currency: "usd",
                product_data: {
                    name: storeItem.name,
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
            success_url: `${process.env.CLIENT_URL}/success.html`,
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

console.log(USER_SHOPPING_CART);

//NOTE: make our application work
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
