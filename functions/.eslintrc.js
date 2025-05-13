const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

admin.initializeApp();
const storage = new Storage();

exports.uploadFile = functions.https.onRequest(async (req, res) => {
  const { fileName, fileContent } = req.body;
  
  try {
    const bucket = storage.bucket('link-50f75.appspot.com');
    const file = bucket.file(fileName);
    await file.save(fileContent);
    res.status(200).send("File uploaded successfully!");
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Failed to upload file.");
  }
});
