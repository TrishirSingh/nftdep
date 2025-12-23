import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const usersCollection = await getUsersCollection();

  if (req.method === "GET") {
    try {
      // Find user by email (from session)
      const user = await usersCollection.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user profile (exclude sensitive data)
      const { _id, email, name, image, bio, username, createdAt, updatedAt } = user;
      return res.status(200).json({
        id: _id.toString(),
        email,
        name,
        image,
        bio: bio || "",
        username: username || "",
        createdAt,
        updatedAt,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const { bio, username, name } = req.body;

      // Validate username (if provided)
      if (username) {
        // Check if username is already taken by another user
        const existingUser = await usersCollection.findOne({
          username: username,
          email: { $ne: session.user.email },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      // Update user profile
      const updateData = {
        updatedAt: new Date(),
      };
      if (bio !== undefined) updateData.bio = bio;
      if (username !== undefined) updateData.username = username;
      if (name !== undefined) updateData.name = name;

      const result = await usersCollection.updateOne(
        { email: session.user.email },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Fetch updated user
      const updatedUser = await usersCollection.findOne({ email: session.user.email });
      const { _id, email, name: userName, image, bio: userBio, username: userUsername, createdAt, updatedAt } = updatedUser;

      return res.status(200).json({
        id: _id.toString(),
        email,
        name: userName,
        image,
        bio: userBio || "",
        username: userUsername || "",
        createdAt,
        updatedAt,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

