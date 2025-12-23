import React, { useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "../utils/contract";
import Button from "../components/Button/Button";
import styles from "../styles/Create.module.css";

const Create = () => {
  const [tokenURI, setTokenURI] = useState("");
  const [price, setPrice] = useState("");
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdTokenId, setCreatedTokenId] = useState(null);

  // Compress and resize image
  const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size must be less than 10MB. Please use a smaller image.");
        return;
      }

      setError(null);
      
      try {
        // Compress image automatically
        const compressedFile = await compressImage(file, 1024, 1024, 0.85);
        console.log(`Image compressed: ${(file.size / 1024).toFixed(2)} KB → ${(compressedFile.size / 1024).toFixed(2)} KB`);
        
        setImageFile(compressedFile);
        
        // Create preview from compressed image
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error("Image compression error:", err);
        setError("Failed to process image. Please try a different image.");
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const createMetadataURI = async () => {
    // If user provided tokenURI, use it
    if (tokenURI.trim()) {
      return tokenURI.trim();
    }

    // Otherwise, create metadata from image and form data
    if (!imageFile) {
      throw new Error("Please upload an image or provide a token URI");
    }

    // Convert image to base64
    // Note: Image is already compressed in handleImageChange
    const imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        // Log size for debugging
        const imageSizeKB = (result.length * 3) / 4 / 1024;
        console.log(`Image base64 size: ${result.length} characters (~${imageSizeKB.toFixed(2)} KB)`);
        
        // Warn if still too large (but don't block, let contract validation handle it)
        if (result.length > 6000) {
          console.warn(`⚠️ Image is large (${imageSizeKB.toFixed(2)} KB). Consider using a smaller image or external URL.`);
        }
        
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Create metadata object
    const metadata = {
      name: nftName || "NFT #" + Date.now(),
      description: nftDescription || "A unique NFT",
      image: imageBase64,
      attributes: [],
    };

    // Convert metadata to JSON and then to data URI
    const metadataJSON = JSON.stringify(metadata);
    // Use btoa with proper encoding for Unicode characters
    const metadataBase64 = btoa(unescape(encodeURIComponent(metadataJSON)));
    const finalURI = `data:application/json;base64,${metadataBase64}`;
    
    // Log final URI size
    console.log(`Final tokenURI size: ${finalURI.length} characters (~${(finalURI.length * 3 / 4 / 1024).toFixed(2)} KB)`);
    
    return finalURI;
  };

  const handleCreate = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid price in ETH");
      return;
    }

    // Validate: either tokenURI or image must be provided
    if (!tokenURI.trim() && !imageFile) {
      setError("Please upload an image or provide a token URI");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(false);
      setCreatedTokenId(null);

      // Create metadata URI (either from tokenURI or from uploaded image)
      const finalTokenURI = await createMetadataURI();

      const result = await marketplaceApi.createToken(finalTokenURI, price);
      
      // Extract token ID from result
      // The createToken function returns { ...receipt, tokenId }
      const tokenId = result?.tokenId;

      if (tokenId) {
        setCreatedTokenId(tokenId);
        setSuccess(true);
        setTokenURI("");
        setPrice("");
        setNftName("");
        setNftDescription("");
        setImageFile(null);
        setImagePreview(null);
        alert(`NFT created and listed successfully!\n\nYour unique Token ID: #${tokenId}\n\nThis token ID has been saved to MongoDB with your wallet address and email.`);
      } else {
        // If tokenId not found, still show success but warn
        setSuccess(true);
        setTokenURI("");
        setPrice("");
        setNftName("");
        setNftDescription("");
        setImageFile(null);
        setImagePreview(null);
        alert("NFT created and listed successfully! (Token ID will be available after transaction confirmation)");
      }
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
        {/* Image Upload Section */}
        <div className={styles.formGroup}>
          <label htmlFor="image">NFT Image *</label>
          {!imagePreview ? (
            <div className={styles.uploadArea}>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              <label htmlFor="image" className={styles.uploadLabel}>
                <span className={styles.uploadIcon}>📷</span>
                <span>Click to upload or drag and drop</span>
                <small>PNG, JPG, GIF up to 10MB (will be auto-compressed)</small>
                <small style={{ marginTop: '0.5rem', display: 'block', color: '#666' }}>
                  💡 Images are automatically resized to max 1024x1024px and compressed
                </small>
              </label>
            </div>
          ) : (
            <div className={styles.imagePreview}>
              <img
                src={imagePreview}
                alt="Preview"
                className={styles.previewImage}
              />
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {imageFile && `Size: ${(imageFile.size / 1024).toFixed(2)} KB`}
              </div>
              <button
                type="button"
                onClick={removeImage}
                className={styles.removeButton}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* NFT Name */}
        <div className={styles.formGroup}>
          <label htmlFor="nftName">NFT Name</label>
          <input
            id="nftName"
            type="text"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder="My Awesome NFT"
            className={styles.input}
          />
        </div>

        {/* NFT Description */}
        <div className={styles.formGroup}>
          <label htmlFor="nftDescription">Description</label>
          <textarea
            id="nftDescription"
            value={nftDescription}
            onChange={(e) => setNftDescription(e.target.value)}
            placeholder="Describe your NFT..."
            className={styles.input}
            rows={4}
          />
        </div>

        {/* Token URI (Optional - for advanced users) */}
        <div className={styles.formGroup}>
          <label htmlFor="tokenURI">
            Token URI (Optional - leave empty if uploading image)
          </label>
          <input
            id="tokenURI"
            type="text"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="https://example.com/metadata.json"
            className={styles.input}
            disabled={!!imageFile}
          />
          <small>
            {imageFile
              ? "Token URI is disabled when image is uploaded"
              : "Or provide a metadata JSON URL directly"}
          </small>
        </div>

        {/* Price */}
        <div className={styles.formGroup}>
          <label htmlFor="price">Price (ETH) *</label>
          <input
            id="price"
            type="number"
            step="0.0001"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.001"
            className={styles.input}
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            <strong>NFT created successfully!</strong>
            {createdTokenId && (
              <div className={styles.tokenIdInfo}>
                <p>Your unique Token ID: <strong>#{createdTokenId}</strong></p>
                <p className={styles.tokenIdNote}>
                  This token ID is unique and will be stored in MongoDB with your wallet address and email.
                </p>
              </div>
            )}
          </div>
        )}

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

