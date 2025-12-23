import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GrClose } from "react-icons/gr";
import { TiSocialLinkedin, TiSocialTwitter, TiSocialYoutube, TiSocialInstagram } from "react-icons/ti";
import { FaGithub } from "react-icons/fa";

//INTERNAL IMPORT
import Style from './Sidebar.module.css';
import images from '../../../img';
import Button from '../../Button/Button';

const Sidebar = ({ setOpenSideMenu }) => {
  const closeSidebar = () => {
    setOpenSideMenu(false);
  };

  // Combined menu items from Discover and Help Center
  const menuItems = [
    // Home
    { name: 'Home', link: '/' },
    // Discover items
    { name: 'Explore', link: '/explore' },
    { name: 'Create NFT', link: '/create' },
    { name: 'My NFTs', link: '/mynfts' },
    { name: 'Active Bids', link: '/bids' },
    { name: 'Search', link: '/search' },
    // Help Center items
    { name: 'About', link: '/about' },
    { name: 'Contact Us', link: '/contact-us' },
  ];

  return (
    <div className={Style.sidebar}>
      <div className={Style.sidebar_inner}>
        <GrClose
          className={Style.sidebar_closeBtn}
          onClick={closeSidebar}
        />
        <Link href="/" onClick={closeSidebar} className={Style.sidebar_logo_link}>
          <Image
            src={images.logo}
            alt="logo"
            width={100}
            height={100}
            className={Style.sidebar_logo}
          />
        </Link>
        <p>Crazy drops, straight from the dopest NFT creators.</p>
        <div className={Style.sidebar_social}>
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
        <div className={Style.sideBar_menu}>
          <div className={Style.sideBar_menu_title}>
            <h3>Menu</h3>
          </div>
          <div className={Style.sideBar_menu_items}>
            {menuItems.map((el, i) => (
              <div key={i + 1} className={Style.sideBar_menu_item}>
                <Link href={el.link} onClick={closeSidebar}>
                  {el.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className={Style.sideBar_button}>
          <Link href="/create">
            <Button btnName="Create NFT" />
          </Link>
          <Button btnName="Connect Wallet" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;