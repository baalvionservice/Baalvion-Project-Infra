import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
  DocumentData,
  WithFieldValue,
} from "firebase/firestore";
import { db } from "./firebase";

export const getDocument = async <T>(
  colName: string,
  id: string,
): Promise<T | null> => {
  const docRef = doc(db!, colName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

export const createDocument = async <T extends WithFieldValue<DocumentData>>(
  colName: string,
  id: string,
  data: T,
): Promise<void> => {
  await setDoc(doc(db!, colName, id), data);
};

export const updateDocument = async <T extends WithFieldValue<DocumentData>>(
  colName: string,
  id: string,
  data: Partial<T>,
): Promise<void> => {
  await updateDoc(doc(db!, colName, id), data as any);
};

export const queryDocuments = async <T>(
  colName: string,
  ...queryConstraints: any[]
): Promise<T[]> => {
  const q = query(collection(db!, colName), ...queryConstraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
};

export const deleteDocument = async (
  colName: string,
  id: string,
): Promise<void> => {
  await deleteDoc(doc(db!, colName, id));
};
