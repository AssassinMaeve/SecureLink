import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../db/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, deleteObject } from "firebase/storage";
import "../style/ProfilePage.scss";

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

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "documents"),
        where("uid", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      const documents: Document[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          filePath: data.filePath,
          fileName: data.fileName,
          downloadURL: "", // will be populated later
        };
      });

      const documentPromises = documents.map(async (doc) => {
        try {
          const fileRef = ref(storage, doc.filePath);
          const downloadURL = await getDownloadURL(fileRef);
          return { ...doc, downloadURL };
        } catch (error) {
          console.warn(`Skipping document "${doc.fileName}" due to missing file.`);
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
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      await deleteDoc(doc(db, "documents", docId));
      setDocs(docs.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document.");
    }
  };

  // Share Document
  const shareDocument = (doc: Document) => {
    if (doc.downloadURL) {
      alert(`Share this document: ${doc.downloadURL}`);
    }
  };

  // On user state change, fetch the documents
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchDocuments();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="profile-container">
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
            />
          ))
        )}
      </div>
    </div>
  );
};

interface DocumentItemProps {
  doc: Document;
  onDelete: () => void;
  onShare: () => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ doc, onDelete, onShare }) => {
  return (
    <div className="document-item">
      <p>{doc.fileName}</p>
      <img src={doc.downloadURL} alt={doc.fileName} width={100} />
      <div>
        <button className="update-btn">Update</button>
        <button className="delete-btn" onClick={onDelete}>
          Delete
        </button>
        <button className="share-btn" onClick={onShare}>
          Share
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
