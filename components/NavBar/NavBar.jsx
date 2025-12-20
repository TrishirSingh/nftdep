import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdNotifications } from 'react-icons/md'; //notification icon from the md c
import { BsSearch } from 'react-icons/bs'; //search icon from the bootstrap
import { CgMenuLeft, CgMenuRight } from 'react-icons/cg';
import { BrowserProvider } from 'ethers';

import Style from "./NavBar.module.css";
import { Discover, HelpCenter, Notification, Profile, Sidebar } from "./index";
import Button from "../Button/Button";
import images from "../../img";

const NavBar = () => {
  const [discover, setDiscover] = useState(false);
  const [help, setHelp] = useState(false);
  const [notification, setNotification] = useState(false);
  const [profile, setProfile] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);  //to set state and close and open 
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const openMenu = (menuName) => {
    if (menuName === "Discover") {
      setDiscover((prev) => !prev);
      setHelp(false);
      setNotification(false);
      setProfile(false);
    } else if (menuName === "Help Center") {
      setHelp((prev) => !prev);
      setDiscover(false);
      setNotification(false);
      setProfile(false);
    }
  };
  const openNotification = () => {
    if(!notification){
      setNotification(true);
      setHelp(false);
      setDiscover(false);
      setProfile(false);
    }
    else{
      setNotification(false);
    }
  }

  const openProfile = () => {
    if(!profile){
      setProfile(true);
      setHelp(false);
      setDiscover(false);
      setNotification(false);
    }else{
      setProfile(false);
    }
  }


  const openSideBar = () => {
    if(!sideMenu){
      setSideMenu(true);
      setHelp(false);
      setDiscover(false);
      setNotification(false);
      setProfile(false);
    }else{
      setSideMenu(false);
    }
  }

  const handleSearch = () => {
    // Handle search functionality here
    console.log("Searching for:", search);
  };

  // Check if wallet is already connected
  useEffect(() => {
    checkWalletConnection();
    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (err) {
        console.error("Error checking wallet:", err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      alert("Wallet connected successfully!");
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className={Style.navbar}>
      <div className={Style.navbar_container}>
        <div className={Style.navbar_container_left}>
          <div className={Style.Logo}>
            <Image src={images.logo} alt="NFT Marketplace Logo" width={100} height={100} />
          </div>
          <div className={Style.navbar_container_left_box_input}>
            <div className={Style.navbar_container_left_box_input_box}>
              <input
                type="text"
                placeholder='Search NFTs'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <BsSearch onClick={handleSearch} className={Style.search_icon} />
            </div>
          </div>
        </div>
        <div className={Style.navbar_container_right}>
          <div className={Style.navbar_container_right_discover}>
            {/* Discover */}
            <p onClick={() => openMenu("Discover")}>Discover</p>
            {discover && (
              <div className={Style.navbar_container_right_discover_box}>
                <Discover />
              </div>
            )}
          </div>
          {/* Help Center */}
          <div className={Style.navbar_container_right_help}>
            <p onClick={() => openMenu("Help Center")}>Help Center</p>
            {help && (
              <div className={Style.navbar_container_right_help_box}>
                <HelpCenter />
              </div>
            )}
          </div>
          {/* Notification */}
          <div className={Style.navbar_container_right_notify}>
            <MdNotifications className={Style.notify} onClick={() => openNotification()} />
            {notification && <Notification />}
          </div>

          {/* Create NFT Button */}
          <div className={Style.navbar_container_right_create}>
            <Link href="/create">
              <Button btnName="Create NFT" />
            </Link>
          </div>

          {/* Connect Wallet Button */}
          {account ? (
            <div className={Style.navbar_container_right_wallet}>
              <span className={Style.walletAddress}>{formatAddress(account)}</span>
            </div>
          ) : (
            <div className={Style.navbar_container_right_wallet}>
              <Button 
                btnName={isConnecting ? "Connecting..." : "Connect Wallet"} 
                handleClick={connectWallet}
              />
            </div>
          )}

          {/* Profile */}
          <div className={Style.navbar_container_right_profile_box}>
            <div className={Style.navbar_container_right_profile}>
              <Image src={images.user1} 
                alt="Profile" 
                width={40} 
                height={40} 
                onClick={() => openProfile()}
                className={Style.navbar_container_right_profile} />
              {profile && <Profile />}
            </div>
          </div>

          {/*Menu Button */}
          <div className={Style.navbar_container_right_menuBtn}>
            <CgMenuRight className={Style.menuBtn} 
              onClick={() => openSideBar()} />

          </div>
        </div>
      </div>
      {/* Sidebar Component only for mobile */}
      {
        sideMenu && (
          <div className={Style.Sidebar}>
            <Sidebar setOpenSideMenu={setSideMenu}/>
          </div>
        )
      }
    </div>
  )
};

export default NavBar;  