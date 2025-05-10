import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../db/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import "../style/ProfilePage.scss";
import Navbar from "./Navbar";

interface Document {
  id: string;
  filePath: string;
  fileName: string;
  downloadURL: string;
}

const ProfilePage: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user documents from Firestore
  const fetchDocuments = async () => {
    if (!auth.currentUser?.uid) return;

    console.log("Fetching documents for user:", auth.currentUser.uid);
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "documents"),
        where("uid", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      console.log("Query returned", querySnapshot.docs.length, "documents");

      const documents: Document[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        console.log("Document data:", data);
        return {
          id: docSnap.id,
          filePath: data.filePath,
          fileName: data.fileName,
          downloadURL: "",
        };
      });

      const documentPromises = documents.map(async (doc) => {
        try {
          const fileRef = ref(storage, doc.filePath);
          const downloadURL = await getDownloadURL(fileRef);
          console.log(`Download URL for ${doc.fileName}:`, downloadURL);
          return { ...doc, downloadURL };
        } catch (error) {
          console.warn(`Skipping document "${doc.fileName}" due to missing file.`, error);
          return null;
        }
      });

      const docsWithURLs = (await Promise.all(documentPromises)).filter(Boolean) as Document[];
      setDocs(docsWithURLs);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Document from Firestore and Firebase Storage
  const deleteDocument = async (docId: string, filePath: string) => {
    console.log("Attempting to delete document:", docId, filePath);
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      console.log("Deleted file from storage:", filePath);

      await deleteDoc(doc(db, "documents", docId));
      console.log("Deleted document from Firestore:", docId);

      setDocs(docs.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document.");
    }
  };

  // Update Document
  const updateDocument = async (docToUpdate: Document, newFile: File) => {
    console.log("Updating document:", docToUpdate, "with file:", newFile.name);
    setLoading(true);
    setError(null);

    try {
      const oldRef = ref(storage, docToUpdate.filePath);
      await deleteObject(oldRef);
      console.log("Deleted old file from storage:", docToUpdate.filePath);

      const newRef = ref(storage, `documents/${auth.currentUser?.uid}/${newFile.name}`);
      await uploadBytes(newRef, newFile);
      console.log("Uploaded new file to storage:", newRef.fullPath);

      const docRef = doc(db, "documents", docToUpdate.id);
      await updateDoc(docRef, {
        fileName: newFile.name,
        filePath: newRef.fullPath,
      });
      console.log("Updated Firestore document:", docToUpdate.id);

      fetchDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
      setError("Failed to update document.");
    } finally {
      setLoading(false);
    }
  };

  // Share Document
  const shareDocument = (doc: Document) => {
    console.log("Sharing document:", doc.fileName);
    if (doc.downloadURL) {
      alert(`Share this document: ${doc.downloadURL}`);
    } else {
      console.warn("Download URL is missing for:", doc.fileName);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User logged in:", user.email);
        setUserEmail(user.email);
        fetchDocuments();
      } else {
        console.log("User not logged in.");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="profile-container">
      <Navbar />
      <main className="profile-content">
        <div className="profile-header">
          <h2>Profile</h2>
          {userEmail ? (
            <p id="user-email">Email: {userEmail}</p>
          ) : (
            <p>Please log in to view your profile.</p>
          )}
        </div>

        <div className="documents-section">
          <h3>Your Documents</h3>
          {loading ? (
            <p>Loading documents...</p>
          ) : error ? (
            <p>{error}</p>
          ) : docs.length === 0 ? (
            <p>No documents found.</p>
          ) : (
            docs.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                onDelete={() => deleteDocument(doc.id, doc.filePath)}
                onShare={() => shareDocument(doc)}
                onUpdate={(file) => updateDocument(doc, file)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

interface DocumentItemProps {
  doc: Document;
  onDelete: () => void;
  onShare: () => void;
  onUpdate: (file: File) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ doc, onDelete, onShare, onUpdate }) => {
  const [showInput, setShowInput] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected new file for update:", file.name);
      onUpdate(file);
      setShowInput(false);
    }
  };

  return (
    <div className="document-item">
      <p>{doc.fileName}</p>
      <img src={doc.downloadURL} alt={doc.fileName} width={100} />
      <div>
        <button className="update-btn" onClick={() => setShowInput(!showInput)}>
          Update
        </button>
        <button className="delete-btn" onClick={onDelete}>
          Delete
        </button>
        <button className="share-btn" onClick={onShare}>
          Share
        </button>
      </div>
      {showInput && (
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
      )}
    </div>
  );
};

export default ProfilePage;
