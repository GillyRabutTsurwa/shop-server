const express = require("express");
const app = express();
const PORT = 4242;

app.use(express.json());
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

// products data hardcoded for now. will try fetching using sanity
const USER_SHOPPING_CART = [
    {
        id: 1,
        stripePriceId: "price_1KIjrrIxbMEkLtTy9YjmxjhC", // Make in dashboard or API
        image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
        title: "Fjallraven - Foldsack No. 1 Backpack",
        description:
            "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday backpack.",
        color: "Navy",
        quantity: 1,
        priceInCents: 10995,
    },
    {
        id: 2,
        stripePriceId: "price_1KJU3vIxbMEkLtTy7MeENvG5",
        image: "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_.jpg",
        title: "MBJ Women's Solid Short Sleeve Boat Neck V",
        description:
            "Made in USA. Lightweight fabric with great stretch for comfort. Ribbed on sleeves and neckline. Double stitching on bottom hem.",
        color: "White",
        quantity: 2,
        priceInCents: 985,
    },
];

app.get("/shopping-cart", (req, res) => {
    res.send({ cart: USER_SHOPPING_CART });
});

app.post("/checkout", async (request, response) => {
    console.log(request.body.items);
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            /** NOTE
             * doing it the hard-coded way till it works - charles' method
             * after getting it to work, I will then use Kyle's method of getting the quanitity and id of product through the browser
             * right now this is being handled by the server.
             */
            line_items: USER_SHOPPING_CART.map((currentItem) => {
                // const storeItem = storeItems.get(currentItem.id); removing this (Kyle's way) for now
                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: currentItem.name,
                        },
                        unit_amount: currentItem.priceInCents,
                    },
                    quantity: currentItem.quantity,
                };
            }),
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
