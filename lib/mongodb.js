// Server-side only — MongoDB connection pool and student CRUD helpers. Never import into client components.
import { MongoClient, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI environment variable');

let clientPromise;

if (process.env.NODE_ENV === 'development') {
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

const VALID_SORT_FIELDS = ['name', 'fathername', 'phone', 'district', 'collegename', 'State', 'group'];

// Server-side paginated query using $facet.
// At least one of district / college / state must be present — enforced by the API layer.
export async function queryStudents({ page = 1, limit = 25, search = '', district = '', college = '', state = '', sort = '', order = 'asc' } = {}) {
  const col = await getCollection();

  const match = {};
  if (state)    match.State       = state;
  if (district) match.district    = district;
  if (college)  match.collegename = college;

  if (search?.trim()) {
    // $regex fallback — add a text index later for better performance on 60k+ docs
    const re = { $regex: search.trim(), $options: 'i' };
    match.$or = [
      { name:        re },
      { fathername:  re },
      { district:    re },
      { collegename: re },
      { State:       re },
      // phone may be NumberLong or string — $regex only works on strings,
      // so coerce to string first via $expr + $toString
      { $expr: { $regexMatch: { input: { $toString: '$phone' }, regex: search.trim(), options: 'i' } } },
    ];
  }

  const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : '_id';
  const sortDoc   = { [sortField]: order === 'desc' ? -1 : 1 };
  const skip      = (Math.max(1, page) - 1) * limit;

  const [result] = await col.aggregate([
    { $match: match },
    {
      $facet: {
        data: [
          { $sort: sortDoc },
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]).toArray();

  const total = result.totalCount[0]?.count ?? 0;
  return {
    data: result.data.map((doc) => ({
      ...doc,
      _id:      doc._id.toString(),
      comments: doc.comments ?? [],
    })),
    pagination: {
      total,
      page:       Math.max(1, page),
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// Returns distinct values for the three filter dropdowns.
export async function getFilterOptions() {
  const col = await getCollection();
  const [states, districts, colleges] = await Promise.all([
    col.distinct('State'),
    col.distinct('district'),
    col.distinct('collegename'),
  ]);
  return {
    states:    states.filter(Boolean).sort(),
    districts: districts.filter(Boolean).sort(),
    colleges:  colleges.filter(Boolean).sort(),
  };
}

// Inserts a new student with an empty comments array.
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

// Appends a new comment to the student's comments array using $push.
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
