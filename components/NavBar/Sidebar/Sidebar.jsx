import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GrClose } from "react-icons/gr";
import { TiSocialFacebook, TiSocialLinkedin, TiSocialTwitter, TiSocialYoutube, TiSocialInstagram, TiArrowSortedDown , TiArrowSortedUp } from "react-icons/ti";

//INTERNAL IMPORT
import Style from './Sidebar.module.css';
import images from '../../../img';
import Button from '../../Button/Button';

const Sidebar = ({ setOpenSideMenu }) => {
  //------USESTATE
  const [openDiscover, setOpenDiscover] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  const discover = [
    {
      name: 'Collection',
      link: 'Collection'
    },
    {
      name: 'Search',
      link: 'search'
    },
    {
      name: 'Author Profile',
      link: 'Collection'
    },
    {
      name: 'NFT Details',
      link: 'NFT-Details'
    },
    {
      name: 'Account Setting',
      link: 'account-setting'
    },
    {
      name: 'Connect Wallet',
      link: 'connect-wallet'
    },
    {
      name: 'Blog',
      link: 'blog'
    }
  ];

  const helpCenter = [
    {
      name: 'About',
      link: 'about'
    },
    {
      name: 'Contact Us',
      link: 'contact-us'
    },
    {
      name: 'Sign Up',
      link: 'signup'
    },
    {
      name: 'Sign In',
      link: 'signin'
    },
    {
      name: 'Subscription',
      link: 'subscription'
    }
  ];

  const closeSidebar = () => {
    setOpenSideMenu(false);
  };

  const OpenDiscoverMenu = () => {
    if(!openDiscover){
    setOpenDiscover(true);
    }else{
      setOpenDiscover(false);
    }
  };

  const OpenHelpMenu = () => {
    if(!openHelp){
      setOpenHelp(true);
    }else{
      setOpenHelp(false);
    }
  };

  return (
    <div className={Style.sidebar}>
      <div className={Style.sidebar_inner}>
        <GrClose
          className={Style.sidebar_closeBtn}
          onClick={closeSidebar}
        />
        <Image
          src={images.logo}
          alt="logo"
          width={100}
          height={100}
          className={Style.sidebar_logo}
        />
        <p>Crazy drops, straight from the dopest NFT creators.</p>
        <div className={Style.sidebar_social}>
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
        <div className={Style.sideBar_menu}>
          <div>
            <div
              className={Style.sideBar_menu_box}
              onClick={OpenDiscoverMenu}
            >
              <p>Discover</p>
              <TiArrowSortedUp />
            </div>
            {openDiscover && (
              <div className={Style.sideBar_discover}>
                {discover.map((el, i) => (
                  <p key={i + 1}>
                    <Link href={{ pathname: el.link }}>{el.name}</Link>
                  </p>
                ))}
              </div>
            )}
          </div>
          <div>
            <div
              className={Style.sideBar_menu_box}
              onClick={OpenHelpMenu}
            >
              <p>Help Center</p>
              <TiArrowSortedUp />
            </div>
            {openHelp && (
              <div className={Style.sideBar_discover}>
                {helpCenter.map((el, i) => (
                  <p key={i + 1}>
                    <Link href={{ pathname: el.link }}>
                      {el.name}
                    </Link>
                  </p>
                ))}
              </div>
            )}
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