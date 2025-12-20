import React from "react";
import Link from "next/link";
import styles from "./Discover.module.css";

// variant: "nav" (default dropdown in navbar) or "footer" (expanded list in footer)
const Discover = ({ variant = "nav" }) => {
  const discover = [
    { name: "Explore", link: "/explore" },
    { name: "Create NFT", link: "/create" },
    { name: "My NFTs", link: "/mynfts" },
    { name: "Collection", link: "Collection" },
    { name: "Search", link: "search" },
    { name: "Author Profile", link: "Collection" },
    { name: "NFT Details", link: "NFT-Details" },
    { name: "Account Setting", link: "account-setting" },
    { name: "Blog", link: "blog" },
  ];

  const rootClassName =
    variant === "footer"
      ? `${styles.discover} ${styles.discoverFooter}`
      : styles.discover;

  return (
    <div className={rootClassName}>
      {discover.map((el, i) => (
        <div key={i + 1} className={styles.discover_box}>
          <Link href={{ pathname: `${el.link}` }}>{el.name}</Link>
        </div>
      ))}
    </div>
  );
};

export default Discover;