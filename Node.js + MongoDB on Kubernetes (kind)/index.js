const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json()); // parse JSON body
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));


// MongoDB URL from Kubernetes environment variable
//const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo-service:27017/mydatabase";

const MONGO_URL = process.env.MONGO_URL;

mongoose.set("strictQuery", true);


setTimeout(connectToMongo, 3000);
// Connect to MongoDB
async function connectToMongo() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URL);
    await mongoose.connect(MONGO_URL);

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("Retrying in 5 seconds...");
    setTimeout(connectToMongo, 5000);
  }
}


connectToMongo();
/* ---------------------------------------------------------
   Mongoose Schema + Model
--------------------------------------------------------- */

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

/* ---------------------------------------------------------
   CRUD Routes
--------------------------------------------------------- */

// Create User
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    return res.status(201).json({ message: "User created", user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Read All Users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Read Single User
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update User
app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Delete User
app.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   Health-check routes for Kubernetes
--------------------------------------------------------- */

app.get("/healthz", (req, res) => res.send("OK"));
app.get("/ready", (req, res) => res.send("READY"));

app.get("/cpu", (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 500) {
    // burn CPU for 500ms
  }
  res.send("CPU spike");
});


/* ---------------------------------------------------------
   Start Server
--------------------------------------------------------- */

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
