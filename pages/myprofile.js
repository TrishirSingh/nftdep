import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { BrowserProvider } from "ethers";
import { marketplaceApi } from "../utils/contract";
import { HiOutlineMail, HiOutlineKey, HiOutlineCollection, HiOutlineHashtag } from "react-icons/hi";
import { MdContentCopy, MdCheckCircle } from "react-icons/md";
import styles from "../styles/MyProfile.module.css";

const MyProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/myprofile");
      return;
    }

    if (status === "authenticated" && session) {
      checkWalletConnection();
    }
  }, [status, session]);

  useEffect(() => {
    if (walletAddress) {
      loadMyNFTs();
    }
  }, [walletAddress]);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        } else {
          // Request connection
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const newAccounts = await provider.listAccounts();
          if (newAccounts.length > 0) {
            setWalletAddress(newAccounts[0].address);
          }
        }
      } catch (err) {
        console.error("Error connecting wallet:", err);
        setError("Please connect your MetaMask wallet to view your profile.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please install MetaMask to view your profile.");
      setLoading(false);
    }
  };

  const loadMyNFTs = async () => {
    if (!walletAddress) {
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const items = await marketplaceApi.fetchMyNFTs();
      setNfts(items);
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setError(err.message || "Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return "Not Connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  const tokenIds = nfts.map((nft) => nft.tokenId).sort((a, b) => a - b);
  const tokenCount = tokenIds.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
      </div>

      {error && (
        <div className={styles.errorCard}>
          <p>{error}</p>
          <button onClick={checkWalletConnection} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.profileGrid}>
        {/* Email Card */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <HiOutlineMail className={styles.cardIcon} />
            <h3>Email</h3>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.infoValue}>{session?.user?.email || "N/A"}</p>
            {session?.user?.email && (
              <button
                onClick={() => copyToClipboard(session.user.email)}
                className={styles.copyBtn}
                title="Copy email"
              >
                {copied ? (
                  <MdCheckCircle className={styles.copyIcon} />
                ) : (
                  <MdContentCopy className={styles.copyIcon} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Wallet Address Card */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <HiOutlineKey className={styles.cardIcon} />
            <h3>Wallet Address</h3>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.infoValue}>
              {walletAddress ? formatAddress(walletAddress) : "Not Connected"}
            </p>
            {walletAddress && (
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className={styles.copyBtn}
                title="Copy wallet address"
              >
                {copied ? (
                  <MdCheckCircle className={styles.copyIcon} />
                ) : (
                  <MdContentCopy className={styles.copyIcon} />
                )}
              </button>
            )}
          </div>
          {walletAddress && (
            <p className={styles.fullAddress}>{walletAddress}</p>
          )}
        </div>

        {/* Token Count Card */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <HiOutlineCollection className={styles.cardIcon} />
            <h3>Tokens Owned</h3>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.infoValue}>{tokenCount}</p>
            <span className={styles.infoLabel}>NFTs</span>
          </div>
        </div>

        {/* Token IDs Card */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <HiOutlineHashtag className={styles.cardIcon} />
            <h3>Token IDs</h3>
          </div>
          <div className={styles.cardContent}>
            {tokenIds.length > 0 ? (
              <div className={styles.tokenIdsList}>
                {tokenIds.map((tokenId, index) => (
                  <span key={tokenId} className={styles.tokenIdBadge}>
                    #{tokenId}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.noTokens}>No tokens owned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

