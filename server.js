const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World! Let's Working with NoSQL Databases");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const uri = "mongodb://adminEbola:passEbola@localhost:27017/?authMechanism=DEFAULT&authSource=EbolaDB";

const connectDB = async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log(`MongoDB connected successfully.`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

connectDB();

// Read All API
app.get("/ebola", async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect();
  const objects = await client
    .db("EbolaDB")
    .collection("ebola")
    .find({})
    .sort({ Date: 1 })
    .limit(10)
    .toArray();
  await client.close();
  res.status(200).send(objects);
});

// Create API
app.post("/ebola/create", async (req, res) => {
  const object = req.body;
  const client = new MongoClient(uri);
  await client.connect();
  await client.db("EbolaDB").collection("ebola").insertOne({
    Country: object.Country,
    Date: object.Date,
    Infected: object.Infected,
    Death: object.Death,

  });
  await client.close();
  res.status(200).send({
    status: "ok",
    message: "Ebola is created",
    Ebola: object,
  });
});

// Update API
app.put("/ebola/update", async (req, res) => {
  const object = req.body;
  const id = object._id;

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).send({ status: "error", message: "Invalid ID" });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    
    const result = await client
      .db("EbolaDB")
      .collection("ebola")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            Country: object.Country,
            Date: object.Date,
            Infected: object.Infected,
            Death: object.Death,

          },
        }
      );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ status: "error", message: "Ebola not found or no changes made" });
    }

    res.status(200).send({
      status: "ok",
      message: "Ebola with ID = " + id + " is updated",
      Ebola: object,
    });
  } catch (error) {
    console.error("Error updating Ebola:", error);
    res.status(500).send({
      status: "error",
      message: "An error occurred while updating the Ebola: " + error.message,
    });
  } finally {
    await client.close();
  }
});

// Delete API
app.delete("/ebola/delete", async (req, res) => {
  try {
    const object = req.body;
    const id = object._id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).send({ status: "error", message: "Invalid ID" });
    }

    const client = new MongoClient(uri);
    await client.connect();

    const result = await client
      .db("EbolaDB")
      .collection("ebola")
      .deleteOne({ _id: new ObjectId(id) });

    await client.close();

    if (result.deletedCount === 0) {
      return res.status(404).send({
        status: "error",
        message: "Ebola not found with ID = " + id,
      });
    }

    res.status(200).send({
      status: "ok",
      ID: id,
      message: "Ebola with ID = " + id + " is deleted",
    });
  } catch (error) {
    console.error("Error deleting Ebola:", error);
    res.status(500).send({
      status: "error",
      message: "An error occurred while deleting the Ebola: " + error.message,
    });
  }
});


// Read Limit API
app.get("/ebola/limit", async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect();
  const objects = await client
    .db("EbolaDB")
    .collection("ebola")
    .find({})
    .sort({ Date: 1 })
    .limit(10000)
    .toArray();
  await client.close();
  res.status(200).send(objects);
});

// Read by id API
app.get("/ebola/:id", async (req, res) => {
  const { params } = req;
  const id = params.id;

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).send({ status: "error", message: "Invalid ID" });
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const object = await client
      .db("EbolaDB")
      .collection("ebola")
      .findOne({ _id: new ObjectId(id) });

    if (!object) {
      return res.status(404).send({ status: "error", message: "Ebola not found" });
    }

    res.status(200).send({
      status: "ok",
      ID: id,
      object: object,
    });
  } catch (error) {
    console.error("Error fetching Ebola:", error);
    res.status(500).send({
      status: "error",
      message: "An error occurred while fetching the Ebola: " + error.message,
    });
  } finally {
    await client.close();
  }
});

// Query by filter API: Search text from Country Name
app.get("/ebola/country/:searchText", async (req, res) => {
  const { params } = req;
  const searchText = params.searchText;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const objects = await client
      .db("EbolaDB")
      .collection("ebola")
      .find({ $text: { $search: searchText } }) // ตรวจสอบว่าคุณได้สร้าง Text Index
      .sort({ Date: 1 })
      .limit(10)
      .toArray();

    res.status(200).send({
      status: "ok",
      searchText: searchText,
      Ebola: objects, // ส่งกลับเป็น Ebola
    });
  } catch (error) {
    console.error("Error querying Ebola:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
      error: error.message, // เพิ่มข้อความข้อผิดพลาด
    });
  } finally {
    await client.close();
  }
});


