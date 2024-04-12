const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();

app.get("/validate", (req, res) => {
  const token = req.query.token;
  const secret =
    "acec655005ad1288027db5d9cf1d232795b11894d8750aaa11e5b11102fa38f9";

  try {
    const decodedPayload = jwt.verify(token, secret);
    const updatedPayload = { ...decodedPayload, status: "abc" };

    const updatedToken = jwt.sign(updatedPayload, secret);
    res.send({ original: token, updated: updatedToken });
  } catch (err) {
    // Token verification failed
    console.error("Token verification failed:", err.message);
    res.status(401).send("Unauthorized");
  }
});

app.listen();
