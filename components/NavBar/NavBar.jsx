import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { MdNotifications } from 'react-icons/md'; //notification icon from the md c
import { BsSearch } from 'react-icons/bs'; //search icon from the bootstrap
import { BrowserProvider } from 'ethers';

import Style from "./NavBar.module.css";
import { Discover, HelpCenter, Notification, Profile, Sidebar } from "./index";
import Button from "../Button/Button";
import images from "../../img";

const NavBar = () => {
  const { data: session, status } = useSession();
  
  // Debug: Log session status
  useEffect(() => {
    console.log("NavBar Session Status:", status);
    console.log("NavBar Session Data:", session);
  }, [status, session]);
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
    setSideMenu((prev) => !prev);
    // Close other menus when opening sidebar
    if (!sideMenu) {
      setHelp(false);
      setDiscover(false);
      setNotification(false);
      setProfile(false);
    }
  }

  const handleSearch = () => {
    if (search.trim()) {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(search.trim())}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
    // Check if user is signed in first
    if (!session) {
      alert("Please sign in with Google first before connecting your wallet.");
      window.location.href = "/auth/signin";
      return;
    }

    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }

    try {
      setIsConnecting(true);
      
      // Wait a bit for MetaMask to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask and try again.");
      }
      
      setAccount(accounts[0]);
      alert("Wallet connected successfully!");
    } catch (err) {
      console.error("Wallet connection error:", err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to connect wallet. ";
      if (err.code === 4001) {
        errorMessage += "Connection request was rejected. Please approve the connection in MetaMask.";
      } else if (err.code === -32002) {
        errorMessage += "A connection request is already pending. Please check MetaMask.";
      } else if (err.message?.includes("No accounts found") || err.message?.includes("unlock")) {
        errorMessage += "Please unlock MetaMask and try again.";
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please make sure MetaMask is unlocked and try again.";
      }
      
      alert(errorMessage);
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
          <Link href="/" className={Style.Logo}>
            <Image src={images.logo} alt="NFT Marketplace Logo" width={100} height={100} />
          </Link>
          <div className={Style.navbar_container_left_box_input}>
            <div className={Style.navbar_container_left_box_input_box}>
              <input
                type="text"
                placeholder='Search NFTs'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
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

          {/* Profile / Sign In */}
          {status === "loading" ? (
            <div className={Style.navbar_container_right_profile_box}>
              <div className={Style.loading}>Loading...</div>
            </div>
          ) : session ? (
            <div className={Style.navbar_container_right_profile_box}>
              <div className={Style.navbar_container_right_profile}>
                {session.user?.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || "Profile"} 
                    width={40} 
                    height={40} 
                    onClick={() => openProfile()}
                    className={Style.navbar_container_right_profile}
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <Image 
                    src={images.user1} 
                    alt="Profile" 
                    width={40} 
                    height={40} 
                    onClick={() => openProfile()}
                    className={Style.navbar_container_right_profile} 
                  />
                )}
                {profile && <Profile session={session} onSignOut={() => signOut()} />}
              </div>
            </div>
          ) : (
            <div className={Style.navbar_container_right_profile_box}>
              <Link href="/auth/signin">
                <Button btnName="Sign In" />
              </Link>
            </div>
          )}

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