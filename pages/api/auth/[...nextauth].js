import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUsersCollection } from "../../../lib/db";

export const authOptions = {
  // Using JWT sessions for authentication (works reliably)
  // But manually saving users to MongoDB for profile features
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Manually save/update user in MongoDB
      try {
        const usersCollection = await getUsersCollection();
        const existingUser = await usersCollection.findOne({ email: user.email });
        
        if (existingUser) {
          // Update existing user
          await usersCollection.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
                image: user.image,
                updatedAt: new Date(),
              },
            }
          );
          console.log("User updated in MongoDB:", user.email);
        } else {
          // Create new user
          await usersCollection.insertOne({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log("User created in MongoDB:", user.email);
        }
      } catch (error) {
        console.error("Error saving user to MongoDB:", error);
        // Don't block sign-in if MongoDB fails
      }
      
      return true;
    },
    async session({ session, token }) {
      // JWT session mode - add user ID from token
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      
      // Try to get user data from MongoDB for profile features
      try {
        const usersCollection = await getUsersCollection();
        const dbUser = await usersCollection.findOne({ email: session.user.email });
        if (dbUser) {
          // Add MongoDB user data to session
          session.user.id = dbUser._id.toString();
          if (dbUser.bio) session.user.bio = dbUser.bio;
          if (dbUser.username) session.user.username = dbUser.username;
        }
      } catch (error) {
        console.error("Error fetching user from MongoDB:", error);
        // Continue with JWT session if MongoDB fails
      }
      
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt", // JWT sessions work reliably
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

