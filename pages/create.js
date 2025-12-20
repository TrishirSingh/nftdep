import React, { useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "../utils/contract";
import Button from "../components/Button/Button";
import styles from "../styles/Create.module.css";

const Create = () => {
  const [tokenURI, setTokenURI] = useState("");
  const [price, setPrice] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!tokenURI.trim()) {
      setError("Please enter a token URI");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid price in ETH");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(false);

      await marketplaceApi.createToken(tokenURI.trim(), price);
      setSuccess(true);
      setTokenURI("");
      setPrice("");
      alert("NFT created and listed successfully!");
    } catch (err) {
      console.error("Create failed:", err);
      setError(err.message || "Failed to create NFT. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create NFT</h1>
      </div>

      <form onSubmit={handleCreate} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="tokenURI">Token URI</label>
          <input
            id="tokenURI"
            type="text"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="https://example.com/metadata.json"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="price">Price (ETH)</label>
          <input
            id="price"
            type="number"
            step="0.0001"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.001"
            className={styles.input}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>NFT created successfully!</div>}

        <div className={styles.actions}>
          <Button
            btnName={isCreating ? "Creating..." : "Create NFT"}
            handleClick={handleCreate}
          />
          <Link href="/explore">
            <Button btnName="Cancel" />
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Create;

