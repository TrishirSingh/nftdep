import React, { useState } from "react";
import Image from "next/image";
import {
  TiSocialFacebook,
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialYoutube,
  TiSocialInstagram,
  TiArrowSortedUp,
  TiArrowSortedDown,
} from "react-icons/ti";
import { RiSendPlaneFill } from "react-icons/ri";
import styles from "./Footer.module.css";
import images from "../../img";
import { Discover, HelpCenter } from "../NavBar";

const Footer = () => {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const toggleDiscover = () => {
    setDiscoverOpen((prev) => !prev);
  };

  const toggleHelp = () => {
    setHelpOpen((prev) => !prev);
  };

  return (
    <div className={styles.footer}>
      <div className={styles.footer_box}>
        <div className={styles.footer_box_social}>
          <Image src={images.logo} alt="logo" width={100} height={100} />
          <p>
            A cozy and sweet digital marketplace for some dope crypto
            collections.
          </p>
          <div className={styles.footer_social}>
            <a href="#">
              <TiSocialFacebook />
            </a>
            <a href="#">
              <TiSocialLinkedin />
            </a>
            <a href="#">
              <TiSocialTwitter />
            </a>
            <a href="#">
              <TiSocialYoutube />
            </a>
            <a href="#">
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
          <div className={styles.subscribe_box}>
            <input type="email" placeholder="Enter your email" />
            <RiSendPlaneFill className={styles.subscribe_box_send} />
          </div>
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
