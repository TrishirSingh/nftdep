import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialYoutube,
  TiSocialInstagram,
  TiArrowSortedUp,
  TiArrowSortedDown,
} from "react-icons/ti";
import { FaGithub } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import styles from "./Footer.module.css";
import images from "../../img";
import { Discover, HelpCenter } from "../NavBar";

const Footer = () => {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  const toggleDiscover = () => {
    setDiscoverOpen((prev) => !prev);
  };

  const toggleHelp = () => {
    setHelpOpen((prev) => !prev);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage("Please enter your email address");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        setMessage("Server error. Please try again later.");
        setMessageType("error");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Thank you for subscribing! We will keep you updated with the latest NFT collections and marketplace news.");
        setMessageType("success");
        setEmail(""); // Clear the input
      } else {
        setMessage(data.error || "Something went wrong. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setMessage("Failed to subscribe. Please try again later.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.footer}>
      <div className={styles.footer_box}>
        <div className={styles.footer_box_social}>
          <Link href="/">
            <Image src={images.logo} alt="logo" width={100} height={100} />
          </Link>
          <p>
            A cozy and sweet digital marketplace for some dope crypto
            collections.
          </p>
          <div className={styles.footer_social}>
            <a href="https://github.com/TrishirSingh" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
            <a href="https://www.linkedin.com/in/trishir-singh/" target="_blank" rel="noopener noreferrer">
              <TiSocialLinkedin />
            </a>
            <a href="https://x.com/Bitcoin?lang=en" target="_blank" rel="noopener noreferrer">
              <TiSocialTwitter />
            </a>
            <a href="https://www.youtube.com/watch?v=NNQLJcJEzv0" target="_blank" rel="noopener noreferrer">
              <TiSocialYoutube />
            </a>
            <a href="https://www.instagram.com/trishirsingh9/" target="_blank" rel="noopener noreferrer">
              <TiSocialInstagram />
            </a>
          </div>
        </div>

        <div className={styles.footer_box_discover}>
          <h3
            onClick={toggleDiscover}
            className={styles.footer_heading_clickable}
          >
            Discover
            {discoverOpen ? <TiArrowSortedUp /> : <TiArrowSortedDown />}
          </h3>
          {discoverOpen && <Discover variant="footer" />}
        </div>

        <div className={styles.footer_box_help}>
          <h3
            onClick={toggleHelp}
            className={styles.footer_heading_clickable}
          >
            Help Center
            {helpOpen ? <TiArrowSortedUp /> : <TiArrowSortedDown />}
          </h3>
          {helpOpen && <HelpCenter variant="footer" />}

          <div className={styles.subscribe}>
            <h3>Subscribe</h3>
          </div>
          <form onSubmit={handleSubscribe} className={styles.subscribe_form}>
            <div className={styles.subscribe_box}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.subscribe_button}
              >
                <MdSend className={styles.subscribe_box_send} />
              </button>
            </div>
            {message && (
              <div
                className={`${styles.subscribe_message} ${
                  messageType === "success"
                    ? styles.subscribe_message_success
                    : styles.subscribe_message_error
                }`}
              >
                {message}
              </div>
            )}
          </form>
          <div className={styles.subscribe_box_info}>
            <p>
              Discover, collect and sell extraordinary NFTs. OpenSea is the
              world's largest NFT marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
