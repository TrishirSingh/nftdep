import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUserAlt, FaRegImage } from "react-icons/fa";
import { TbDownload } from "react-icons/tb";

//INTERNAL IMPORT
import Style from './profile.module.css';
import images from '../../../img'

const Profile = ({ session, onSignOut }) => {
  const user = session?.user;
  
  return (
    <div className={Style.profile}>
      <div className={Style.profile_account}>
        {user?.image ? (
          <Image 
            src={user.image} 
            alt={user.name || "user profile"} 
            width={50} 
            height={50} 
            className={Style.profile_account_img}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <Image 
            src={images.user1} 
            alt="user profile" 
            width={50} 
            height={50} 
            className={Style.profile_account_img}
          />
        )}
        <div className={Style.profile_account_info}>
          <p>{user?.name || "User"}</p>
          <small>{user?.email || ""}</small>
        </div>
      </div>
      <div className={Style.profile_menu}>
        <div className={Style.profile_menu_one}>
          <div className={Style.profile_menu_one_item}>
            <FaUserAlt />
            <p>
              <Link href="/myprofile">My Profile</Link>
            </p>
          </div>
          <div className={Style.profile_menu_one_item}>
            <FaRegImage />
            <p>
              <Link href="/mynfts">My NFTs</Link>
            </p>
          </div>
        </div>
        <div className={Style.profile_menu_two}>
          <div className={Style.profile_menu_one_item} onClick={onSignOut} style={{ cursor: "pointer" }}>
            <TbDownload />
            <p>Sign Out</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;