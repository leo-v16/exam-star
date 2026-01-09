import { db, storage } from "./firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Types ---

export interface Chapter {
  name: string;
}

export interface ClassLevel {
  name: string;
  chapters: string[]; // Chapter names
}

export interface Subject {
  name: string;
  classes: ClassLevel[];
}

export interface ExamStructure {
  subjects: Subject[];
}

export interface Exam {
  id: string; // slug, e.g., 'jee-mains'
  name: string; // Display name, e.g., 'JEE Mains'
  structure: ExamStructure;
}

export interface Resource {
  id?: string;
  examId: string;
  subject: string;
  class: string;
  chapter: string;
  type: string;
  year?: string;
  title: string;
  subtitle?: string;
  fileUrl: string;
  createdAt?: Date;
  order?: number;
}

export interface ExamEvent {
  id?: string;
  title: string;
  date: Date; // stored as Timestamp in Firestore
  description?: string;
  type: 'exam' | 'registration' | 'result' | 'other';
  examId?: string; // Optional link to an exam
  link?: string;
}

// --- Global Cache Hash ---

export const updateDataHash = async () => {
  const ref = doc(db, "settings", "metadata");
  await setDoc(ref, { hash: Date.now().toString() }, { merge: true });
};

export const getDataHash = async (): Promise<string | null> => {
  const ref = doc(db, "settings", "metadata");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().hash as string;
  }
  return null;
};

// --- Exam Structure Helpers ---

export const saveExamStructure = async (examId: string, structure: ExamStructure) => {
  const examRef = doc(db, "exams", examId);
  // We merge to avoid overwriting other fields like 'name' if they exist, 
  // but for structure updates, we usually want to replace the structure.
  await setDoc(examRef, { structure }, { merge: true });
  await updateDataHash();
};

export const getExamStructure = async (examId: string): Promise<ExamStructure | null> => {
  const examRef = doc(db, "exams", examId);
  const snap = await getDoc(examRef);
  if (snap.exists()) {
    return snap.data().structure as ExamStructure;
  }
  return null;
};

export const getExam = async (examId: string): Promise<Exam | null> => {
  const examRef = doc(db, "exams", examId);
  const snap = await getDoc(examRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Exam;
  }
  return null;
};

export const getAllExams = async (): Promise<Exam[]> => {
  const examsRef = collection(db, "exams");
  const snap = await getDocs(examsRef);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Exam));
};

// --- Resource Helpers ---

export const getResourceTypes = async (): Promise<string[]> => {
  const ref = doc(db, "settings", "resource-types");
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    return snap.data().types as string[];
  } else {
    // Initialize with defaults if not exists
    const defaults = ["note", "pyq", "practice"];
    await setDoc(ref, { types: defaults });
    return defaults;
  }
};

export const addResourceType = async (newType: string) => {
  const ref = doc(db, "settings", "resource-types");
  const snap = await getDoc(ref);
  let types = ["note", "pyq", "practice"];
  
  if (snap.exists()) {
    types = snap.data().types;
  }
  
  if (!types.includes(newType)) {
    types.push(newType);
    await setDoc(ref, { types });
    await updateDataHash();
  }
};

export const deleteResourceType = async (typeToDelete: string) => {
  const ref = doc(db, "settings", "resource-types");
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const types = snap.data().types as string[];
    const updatedTypes = types.filter(t => t !== typeToDelete);
    await setDoc(ref, { types: updatedTypes });
    await updateDataHash();
  }
};

export const updateResourceType = async (oldName: string, newName: string) => {
  // 1. Update the list in settings
  const settingsRef = doc(db, "settings", "resource-types");
  const snap = await getDoc(settingsRef);
  
  if (snap.exists()) {
    const types = snap.data().types as string[];
    const index = types.indexOf(oldName);
    if (index !== -1) {
      types[index] = newName;
      await setDoc(settingsRef, { types });
    }
  }

  // 2. Update all resources that have this type
  const resourcesRef = collection(db, "resources");
  const q = query(resourcesRef, where("type", "==", oldName));
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { type: newName });
  });
  
  await batch.commit();
  await updateDataHash();
};

export const addResource = async (resource: Omit<Resource, 'id'>) => {
  const resourcesRef = collection(db, "resources");
  
  // Fetch existing resources to determine order (prepend/top-most)
  // We query by the same category constraints
  const q = query(
    resourcesRef, 
    where("examId", "==", resource.examId),
    where("subject", "==", resource.subject),
    where("class", "==", resource.class),
    where("chapter", "==", resource.chapter),
    where("type", "==", resource.type)
  );
  const snap = await getDocs(q);
  let minOrder = 0;
  if (!snap.empty) {
    const orders = snap.docs.map(d => d.data().order as number | undefined).filter(o => o !== undefined) as number[];
    if (orders.length > 0) {
      minOrder = Math.min(...orders);
    }
  }

  await addDoc(resourcesRef, {
    ...resource,
    order: minOrder - 1,
    createdAt: new Date()
  });
  await updateDataHash();
};

export const updateResourceOrder = async (items: { id: string; order: number }[]) => {
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(db, "resources", item.id);
    batch.update(ref, { order: item.order });
  });
  await batch.commit();
  await updateDataHash();
};

export const deleteResource = async (resourceId: string) => {
  const resourceRef = doc(db, "resources", resourceId);
  await deleteDoc(resourceRef);
  await updateDataHash();
};

export const getResources = async (
  examId: string, 
  subject: string, 
  classLevel: string, 
  chapter: string,
  type?: string
): Promise<Resource[]> => {
  const resourcesRef = collection(db, "resources");
  const constraints = [
    where("examId", "==", examId),
    where("subject", "==", subject),
    where("class", "==", classLevel),
    where("chapter", "==", chapter)
  ];
  
  if (type) {
    constraints.push(where("type", "==", type));
  }

  const q = query(resourcesRef, ...constraints);
  
  const snap = await getDocs(q);
  const resources = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource));
  
  // Sort by order (asc), then by createdAt (desc)
  return resources.sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    
    // Fallback to createdAt if orders are equal
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// --- Event Helpers ---

export const addEvent = async (event: Omit<ExamEvent, 'id'>) => {
  const eventsRef = collection(db, "events");
  await addDoc(eventsRef, {
    ...event,
    // Ensure date is stored as a Timestamp or Date object
    date: event.date 
  });
  await updateDataHash();
};

export const deleteEvent = async (eventId: string) => {
  const eventRef = doc(db, "events", eventId);
  await deleteDoc(eventRef);
  await updateDataHash();
};

export const updateEvent = async (eventId: string, eventData: Partial<ExamEvent>) => {
  const eventRef = doc(db, "events", eventId);
  await updateDoc(eventRef, eventData);
  await updateDataHash();
};

export const getEvents = async (): Promise<ExamEvent[]> => {
  const eventsRef = collection(db, "events");
  // Simple query: get all. Client can filter/sort.
  const snap = await getDocs(eventsRef);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamp to JS Date
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
    } as ExamEvent;
  }).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending
};