const express = require("express");
const fsPromises = require("fs/promises");
const readXlsxFile = require("read-excel-file/node");
const multer = require("multer");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const { createClient } = require("redis");
require("dotenv").config();
const ExcelJs = require("exceljs");
const app = express();

const cache = require("./midleware/cach");
const downloadExslFile = require("./utils/downloadExslFile");

//port
const port = process.env.PORT || 5050;
const REDIS_PORT = process.env.PORT || 6379;

// redis setup
// url: "redis://redis:6379",
const client = createClient(REDIS_PORT);
client.connect();
client.on("connect", () => {
  console.log("connected");
});
client.on("end", () => {
  console.log("disconnected");
});
client.on("reconnecting", () => {
  console.log("reconnecting");
});
client.on("error", (err) => console.log("Redis Client Error", err));

app.use(express.static("./public"));
const middleware = [cors(), morgan("dev")];
app.use(middleware);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// create the connection to database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
});

connection.connect(function (err) {
  if (err) {
    return console.error("database connected error: " + err.message);
  }
  console.log("Database connected.");
});

// file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});
const uploadFile = multer({ storage: storage });

// route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// route
app.get("/students", cache, async (req, res) => {
  console.log("data fatching...");
  let selectQuery = "SELECT * FROM `students`";
  connection.query(selectQuery, (error, response) => {
    if (error) throw error;
    else {
      // Set data to Redis
      client.set("user-list", JSON.stringify(response));
      res.send(response);
    }
  });
});

app.post(
  "/import-excel",
  uploadFile.single("import-excel"),
  async (req, res) => {
    await importFileToDb(__dirname + "/uploads/" + req.file.filename);
    res.send("Import data successfully");
  }
);

async function importFileToDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    let insertQuery =
      "INSERT INTO students (name, email, university, father_name, mother_name, address, gander, age, mobile, date) VALUES ?";
    connection.query(insertQuery, [rows], (error, response) => {
      console.log(error || response);
    });

    // console.log(rows);
    client.set("user-list", JSON.stringify(rows));
    fsPromises.unlink(exFile);
  });
}

app.get("/downloads", async (req, res) => {
  const value = await client.get("user-list");
  if (value) {
    downloadExslFile(JSON.parse(value));
    return res.send("Download Successfully from cache");
  }

  let selectQuery = "SELECT * FROM `students`";
  connection.query(selectQuery, (error, response) => {
    // console.log(error || response);
    if (error) {
      return res.send("Data get fail");
    } else {
      // console.log(response);
      try {
        downloadExslFile(response);
        res.send("Download Successfully from database");
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });
});

// run server

app.listen(port, () => {
  console.log("Server running on port ", port);
});
