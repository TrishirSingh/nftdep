import React, { useState } from "react";
import { AiOutlineMail, AiOutlineSend, AiOutlineUser, AiOutlineMessage } from "react-icons/ai";
import styles from "../styles/Contact.module.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage("Message sent successfully! We'll get back to you soon.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");
      setSubmitMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Get in <span className={styles.accent}>Touch</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Have a question or want to reach out? We'd love to hear from you!
          </p>
        </div>
        <div className={styles.heroGlow}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.contactInfo}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <AiOutlineMail />
            </div>
            <h3 className={styles.infoTitle}>Email Us</h3>
            <a href="mailto:trishirsingh9@gmail.com" className={styles.emailLink}>
              trishirsingh9@gmail.com
            </a>
            <p className={styles.infoDescription}>
              Send us an email directly or use the form below
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Send us a Message</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                <AiOutlineUser className={styles.labelIcon} />
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                <AiOutlineMail className={styles.labelIcon} />
                Your Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>
                <AiOutlineMessage className={styles.labelIcon} />
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Type your message here..."
                rows="6"
                required
              />
            </div>

            {submitStatus && (
              <div
                className={`${styles.statusMessage} ${
                  submitStatus === "success" ? styles.success : styles.error
                }`}
              >
                {submitMessage}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Sending...
                </>
              ) : (
                <>
                  <AiOutlineSend className={styles.sendIcon} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

