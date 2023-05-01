import { createClient } from "@sanity/client";
import groq from "groq";

const client = createClient({
    name: "default",
    title: "shop",
    projectId: "qqpcfqbo",
    dataset: "production",
    apiVersion: "2022-01-12", // use current date (YYYY-MM-DD) to target the latest API version
    useCdn: true,
});

export default async function fetchProducts() {
    const products = await client.fetch(groq`*[_type == "product"]`);
    return products;
}

fetchProducts();
