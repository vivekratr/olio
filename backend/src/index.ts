import express from "express";
import "dotenv/config";

const app = express();

const PORT = process.env.PORT || 5000;

app.get("/", (_, res) => {
    res.send("Backend is running!");

})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})