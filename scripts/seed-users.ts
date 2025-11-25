import "dotenv/config";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { demoUsers } from "@/lib/demo-users";

async function seedUsers() {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  const emails = demoUsers.map((user) => user.email);
  await usersCollection.deleteMany({ email: { $in: emails } });

  const timestamp = new Date();
  const documents = await Promise.all(
    demoUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  const insertResult = await usersCollection.insertMany(documents);

  console.log(
    `Seeded ${insertResult.insertedCount} user(s): ${emails.join(", ")}`,
  );
  await client.close();
}

seedUsers()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed users:", error);
    process.exit(1);
  });

