import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import Button from "../components/Button/Button";
import styles from "../styles/EditProfile.module.css";

const EditProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/edit-profile");
      return;
    }

    if (status === "authenticated" && session) {
      fetchProfile();
    }
  }, [status, session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setFormData({
        name: data.name || "",
        username: data.username || "",
        bio: data.bio || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/myprofile");
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Profile</h1>
        <Link href="/myprofile">
          <Button btnName="Cancel" />
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.profileImageSection}>
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "Profile"}
              width={100}
              height={100}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <p className={styles.imageNote}>
            Profile image is managed by Google. Change it in your Google account.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="@username"
            className={styles.input}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
          />
          <small>Username can only contain letters, numbers, and underscores</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            className={styles.textarea}
            rows={5}
            maxLength={500}
          />
          <small>{formData.bio.length}/500 characters</small>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            Profile updated successfully! Redirecting...
          </div>
        )}

        <div className={styles.actions}>
          <Button
            btnName={saving ? "Saving..." : "Save Changes"}
            handleClick={handleSubmit}
            disabled={saving}
          />
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

