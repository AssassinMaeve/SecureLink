import React, { useState } from "react";
import { db, auth, storage } from "../db/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, getMetadata } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { FirebaseError } from "firebase/app"; // Import FirebaseError to type check errors

const UploadDocForm = () => {
  const [docType, setDocType] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user] = useAuthState(auth);

  const MAX_FILE_SIZE = 102400; // 100KB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
  const MAX_AADHAAR_LENGTH = 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      // Validate form inputs
      if (!docType || !aadhaar || !file) {
        throw new Error("Please fill all fields and upload a file.");
      }

      if (aadhaar.length !== MAX_AADHAAR_LENGTH) {
        throw new Error(`Aadhaar number must be exactly ${MAX_AADHAAR_LENGTH} digits.`);
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024}KB limit.`);
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error("Only JPG, PNG, and PDF files are allowed.");
      }

      if (!user?.uid) {
        throw new Error("User not authenticated. Please login again.");
      }

      console.log("Form validation successful. Starting file upload...");

      // Check if a document of this type is already uploaded in Firestore
      const docQuery = query(
      collection(db, "documents"),
      where("uid", "==", user.uid),
      where("docType", "==", docType)
    );
    const querySnapshot = await getDocs(docQuery);
    if (!querySnapshot.empty) {
      throw new Error(`You have already uploaded a ${docType}. You can't upload more of the same type.`);
    }


      // Prepare file metadata
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `documents/${user.uid}/${timestamp}_${sanitizedFileName}`;
      const fileRef = ref(storage, filePath);

      // Check if the file already exists in Firebase Storage
      try {
        await getMetadata(fileRef); // Try fetching metadata of the file
        throw new Error("The file already exists in Firebase Storage.");
      } catch (error) {
        if (error instanceof FirebaseError && error.code !== "storage/object-not-found") {
          throw error; // If the error is not 'object-not-found', throw it
        }
        console.log("File does not exist in Firebase Storage. Proceeding with upload...");
      }

      console.log("No existing document found for this type. Proceeding with upload...");

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(fileRef, file);

      // Set up upload progress listener
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`Upload progress: ${progress}%`);
        },
        (error) => {
          console.error("Upload error:", error);
          throw error;
        }
      );

      // Wait for upload to complete
      await uploadTask;
      const downloadURL = await getDownloadURL(fileRef);

      console.log("File upload completed successfully.");

      // Save document metadata to Firestore
      console.log("Saving document metadata to Firestore...");
      await addDoc(collection(db, "documents"), {
        uid: user.uid,
        docType,
        aadhaar,
        fileName: file.name,
        filePath,
        fileType: file.type,
        fileSize: file.size,
        downloadURL,
        createdAt: Timestamp.now(),
        status: "pending_review",
        lastUpdated: Timestamp.now()
      });

      // Reset form and show success
      setDocType("");
      setAadhaar("");
      setFile(null);
      setUploadProgress(0);
      setSuccess("Document uploaded successfully!");

      console.log("Document uploaded and metadata saved successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Clear previous errors
    setError("");

    console.log(`File selected: ${selectedFile.name}, size: ${selectedFile.size} bytes`);

    // Validate file
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${MAX_FILE_SIZE / 1024}KB limit.`);
      e.target.value = "";
      setFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload JPG, PNG, or PDF.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
    console.log("File validation passed.");
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <h3>Submit Document Info</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-group">
        <select
          id="docType"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          required
          disabled={isUploading}
          aria-label="Select document type"
        >
          <option value="">Select Document Type</option>
          <option value="Mark Sheet">Mark Sheet</option>
          <option value="PAN Card">PAN Card</option>
          <option value="Passport">Passport</option>
          <option value="Aadhaar Card">Aadhaar Card</option>
        </select>
      </div>

      <div className="form-group">
        <input
          id="aadhaar"
          type="text"
          placeholder={`Enter ${MAX_AADHAAR_LENGTH}-digit Aadhaar`}
          value={aadhaar}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d{0,12}$/.test(value)) {
              setAadhaar(value);
            }
          }}
          required
          maxLength={MAX_AADHAAR_LENGTH}
          disabled={isUploading}
          pattern="\d{12}"
          title={`Please enter exactly ${MAX_AADHAAR_LENGTH} digits`}
        />
      </div>

  <div className="form-group">
  <input
    type="file"
    id="document"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={handleFileChange}
    required
    disabled={isUploading}
    aria-label="Select document to upload"
    style={{ display: "none" }} // Hides default input
  />
  <label htmlFor="document" className="custom-file-label">
    {file ? "Change File" : "Choose File"}
  </label>
  {file && (
    <div className="file-info">
      <span>{file.name}</span>
      <span>{(file.size / 1024).toFixed(2)}KB</span>
    </div>
  )}
</div>


      {isUploading && (
        <div className="upload-progress">
          <progress
            value={uploadProgress}
            max="100"
            aria-label={`Upload progress: ${uploadProgress}%`}
          />
          <span>{uploadProgress}%</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || !file}
        className={`submit-button ${isUploading ? "loading" : ""}`}
        aria-busy={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  );
};

export default UploadDocForm;
