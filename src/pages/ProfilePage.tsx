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
  docType: string;
  uploadDate?: string;
}

const ProfilePage: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Enhanced logging function
  const log = (message: string, data?: any) => {
    console.log(`[ProfilePage] ${message}`, data || '');
  };

  // Fetch user documents from Firestore
  const fetchDocuments = async () => {
    if (!auth.currentUser?.uid) {
      log("No user UID available");
      return;
    }

    log("Fetching documents for user", { uid: auth.currentUser.uid });
    setLoading(true);

    try {
      const q = query(
        collection(db, "documents"),
        where("uid", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      log("Documents query returned", { count: querySnapshot.docs.length });

      const documents: Document[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        log("Processing document", { id: docSnap.id, data });
        return {
          id: docSnap.id,
          filePath: data.filePath,
          fileName: data.fileName,
          downloadURL: "",
          docType: data.docType,
          uploadDate: data.uploadDate || new Date().toISOString(),
        };
      });

      const documentPromises = documents.map(async (doc) => {
        try {
          const fileRef = ref(storage, doc.filePath);
          const downloadURL = await getDownloadURL(fileRef);
          log(`Download URL for ${doc.fileName}`, { downloadURL });
          return { ...doc, downloadURL };
        } catch (error) {
          log(`Skipping document "${doc.fileName}" due to missing file`, error);
          return null;
        }
      });

      const docsWithURLs = (await Promise.all(documentPromises)).filter(Boolean) as Document[];
      
      // Sort by upload date, newest first
      docsWithURLs.sort((a, b) => {
        return new Date(b.uploadDate || "").getTime() - new Date(a.uploadDate || "").getTime();
      });
      
      setDocs(docsWithURLs);
      log("Documents state updated", { count: docsWithURLs.length });
    } catch (err) {
      log("Error fetching documents", err);
    } finally {
      setLoading(false);
      log("Finished loading documents");
    }
  };

  // Delete Document from Firestore and Firebase Storage
  const deleteDocument = async (docId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      log("Document deletion cancelled by user");
      return;
    }
    
    log("Attempting to delete document", { docId, filePath });
    setLoading(true);
    
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      log("Deleted file from storage", { filePath });

      await deleteDoc(doc(db, "documents", docId));
      log("Deleted document from Firestore", { docId });

      setDocs(docs.filter((doc) => doc.id !== docId));
      log("Updated local documents state after deletion");
    } catch (error) {
      log("Error deleting document", error);
    } finally {
      setLoading(false);
      log("Finished delete operation");
    }
  };

  // Update Document
  const updateDocument = async (docToUpdate: Document, newFile: File) => {
    log("Updating document", { docId: docToUpdate.id, fileName: newFile.name });
    setLoading(true);

    try {
      const oldRef = ref(storage, docToUpdate.filePath);
      await deleteObject(oldRef);
      log("Deleted old file from storage", { filePath: docToUpdate.filePath });

      const newRef = ref(storage, `documents/${auth.currentUser?.uid}/${newFile.name}`);
      await uploadBytes(newRef, newFile);
      log("Uploaded new file to storage", { path: newRef.fullPath });

      const docRef = doc(db, "documents", docToUpdate.id);
      await updateDoc(docRef, {
        fileName: newFile.name,
        filePath: newRef.fullPath,
        uploadDate: new Date().toISOString(),
      });
      log("Updated Firestore document", { docId: docToUpdate.id });

      await fetchDocuments();
    } catch (error) {
      log("Error updating document", error);
    } finally {
      setLoading(false);
      log("Finished update operation");
    }
  };

  // Share Document
  const shareDocument = (doc: Document) => {
    log("Sharing document", { fileName: doc.fileName });
    if (doc.downloadURL) {
      navigator.clipboard.writeText(doc.downloadURL)
        .then(() => {
          log("Document URL copied to clipboard");
          alert("Document URL copied to clipboard!");
        })
        .catch((err) => {
          log("Could not copy URL", err);
          alert(`Share this document: ${doc.downloadURL}`);
        });
    } else {
      log("Download URL missing for document", { fileName: doc.fileName });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <i className="fas fa-file-pdf"></i>;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <i className="fas fa-file-image"></i>;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <i className="fas fa-file-word"></i>;
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <i className="fas fa-file-excel"></i>;
    } else {
      return <i className="fas fa-file"></i>;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        log("User logged in", { email: user.email });
        setUserEmail(user.email);
        fetchDocuments();
      } else {
        log("User not logged in");
      }
    });
    return () => {
      log("Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  return (
    <div className="profile-container">
      <Navbar/>
      <div className="profile-content">
        <div className="profile-header">
          <h2>My Profile</h2>
          {userEmail ? (
            <p id="user-email">{userEmail}</p>
          ) : (
            <p>Please log in to view your profile.</p>
          )}
        </div>

        <div className="documents-section">
          <h3>My Documents</h3>
          {loading ? (
            <div className="loading">Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="no-documents">
              <i className="fas fa-folder-open"></i>
              <p>No documents found.</p>
            </div>
          ) : (
            <div className="document-list">
              {docs.map((doc) => (
                <div className="document-item" key={doc.id}>
                  <div className="document-info">
                    {doc.downloadURL ? (
                      <img 
                        src={doc.downloadURL} 
                        alt={doc.fileName}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('file-icon-fallback');
                        }}
                      />
                    ) : (
                      <div className="file-icon">{getFileIcon(doc.fileName)}</div>
                    )}
                    <div className="document-details">
                      <span className="document-title">{doc.fileName}</span>
                      <span className="document-type">{doc.docType}</span>
                      <span className="document-date">Uploaded on {formatDate(doc.uploadDate)}</span>
                    </div>
                  </div>
                  <div className="document-actions">
                    {doc.downloadURL && (
                      <a 
                        href={doc.downloadURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn primary-btn"
                      >
                        <i className="fas fa-download"></i>
                        Download
                      </a>
                    )}
                    <button
                      className="btn share-btn"
                      onClick={() => shareDocument(doc)}
                    >
                      <i className="fas fa-share-alt"></i>
                      Share
                    </button>
                    <DocumentUpdateButton 
                      onUpdate={(file) => updateDocument(doc, file)}
                    />
                    <button
                      className="btn delete-btn"
                      onClick={() => deleteDocument(doc.id, doc.filePath)}
                    >
                      <i className="fas fa-trash-alt"></i>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DocumentUpdateButtonProps {
  onUpdate: (file: File) => void;
}

const DocumentUpdateButton: React.FC<DocumentUpdateButtonProps> = ({ onUpdate }) => {
  const [showInput, setShowInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdate = () => {
    setShowInput(true);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected new file for update:", file.name);
      onUpdate(file);
      setShowInput(false);
    }
  };

  return (
    <>
      <button className="btn primary-btn" onClick={handleUpdate}>
        <i className="fas fa-sync-alt"></i>
        Update
      </button>
      {showInput && (
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      )}
    </>
  );
};

export default ProfilePage;