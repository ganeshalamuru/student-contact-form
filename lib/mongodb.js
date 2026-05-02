// Server-side only — MongoDB connection pool and student CRUD helpers. Never import into client components.
import { MongoClient, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI environment variable');

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Reuse connection across hot reloads in development
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
}

// Returns all students, normalising _id to string and comments to [].
export async function getStudents() {
  const col = await getCollection();
  const docs = await col.find({}).toArray();
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    comments: doc.comments ?? [],
  }));
}

// Inserts a new student with an empty comments array.
// Throws if a document with the same phone digits already exists.
export async function insertStudent(data) {
  const col = await getCollection();

  const phoneDigits = String(data.phone ?? '').replace(/\D/g, '');
  const all = await col.find({}, { projection: { phone: 1 } }).toArray();
  const dup = all.find((d) => String(d.phone).replace(/\D/g, '') === phoneDigits);
  if (dup) throw new Error(`Phone ${data.phone} already exists`);

  const now = new Date();
  const result = await col.insertOne({
    State:       data.State       ?? '',
    district:    data.district    ?? '',
    name:        data.name        ?? '',
    fathername:  data.fathername  ?? '',
    phone:       data.phone       ?? '',
    group:       data.group       ?? '',
    collegename: data.collegename ?? '',
    comments:    [],
    createdAt:   now,
    updatedAt:   now,
  });
  return result.insertedId.toString();
}

// Appends a new comment object to the student's comments array using $push.
// Returns the full updated comments array.
export async function appendComment(id, text, createdBy = 'admin') {
  const col = await getCollection();
  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $push: { comments: { text, createdAt: new Date(), createdBy } },
      $set:  { updatedAt: new Date() },
    },
    { returnDocument: 'after' },
  );
  if (!updated) throw new Error('Student not found');
  return updated.comments ?? [];
}
