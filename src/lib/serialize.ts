// Convert a Mongoose doc/lean object into a plain JSON-safe object the client
// can consume (ObjectId -> string, Date -> ISO string).
export function serialize<T = any>(doc: any): T {
  return JSON.parse(JSON.stringify(doc));
}
