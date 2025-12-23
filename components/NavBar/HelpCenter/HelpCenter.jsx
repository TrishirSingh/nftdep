import React from "react";
import Link from "next/link";
import styles from "./HelpCenter.module.css";

// variant: "nav" (default dropdown in navbar) or "footer" (expanded list in footer)
const HelpCenter = ({ variant = "nav" }) => {
  const helpCenter = [
    { name: "About", link: "/about" },
    { name: "Contact Us", link: "/contact-us" },
  ];

  const rootClassName =
    variant === "footer"
      ? `${styles.helpCenter} ${styles.helpCenterFooter}`
      : styles.helpCenter;

  return (
    <div className={rootClassName}>
      {helpCenter.map((el, i) => (
        <div key={i + 1} className={styles.helpCenter_box}>
          <Link href={el.link}>{el.name}</Link>
        </div>
      ))}
    </div>
  );
};

export default HelpCenter;