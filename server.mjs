import fetchProducts from "./sanity.mjs";
import express from "express";
import dotenv from "dotenv";
import Stripe from "stripe";

const app = express();
const PORT = 4242;

app.use(express.json());
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const products = await fetchProducts();
console.log(products);

//NOTE: unfinished code from here...
const USER_SHOPPING_CART = products;

app.get("/shopping-cart", (req, res) => {
    res.send({ cart: USER_SHOPPING_CART });
});

app.post("/checkout", async (request, response) => {
    console.log(request.body.items);
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            // @todo - make this work in the client
            line_items: request.body.items.map((currentItem) => {
                const storeItem = products.find((currentProduct) => currentProduct.id === currentItem.id);
                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: storeItem.name,
                        },
                        unit_amount: storeItem.priceInCents,
                    },
                    quantity: currentItem.quantity,
                };
            }),
            // NOTE: ...to here
            success_url: `${process.env.CLIENT_URL}/success.html`,
            cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        });
        response.json({ url: session.url });
    } catch (err) {
        response.status(500).json({
            error: err.message,
        });
    }
});

console.log(USER_SHOPPING_CART);

//NOTE: make our application work
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
