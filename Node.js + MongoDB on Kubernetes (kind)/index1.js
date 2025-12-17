const mongoose = require("mongoose");
const express = require("express");
const app = express();

// Always load only from ENV inside Kubernetes
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo-service:27017/mydatabase";

console.log("Using Mongo URL:", MONGO_URL);

// mongoose recommended setup
mongoose.set("strictQuery", true);

async function connectToMongo() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed. Retrying in 5 seconds...");
    setTimeout(connectToMongo, 5000);
  }
}

connectToMongo();

app.get("/", (req, res) => {
  res.send("Node app connected to MongoDB successfully!");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running at port 3000");
});

