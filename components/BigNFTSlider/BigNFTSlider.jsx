import React, { useState } from "react";
import Image from "next/image";
import {
  AiFillFire,
  AiFillHeart,
  AiOutlineHeart,
} from "react-icons/ai";
import { MdVerified, MdTimer } from "react-icons/md";
import {
  TbArrowBigRightLines,
  TbArrowBigLeftLines,
} from "react-icons/tb";

import styles from "./BigNFTSlider.module.css";
import images from "../../img";
import Button from "../Button/Button";
import { marketplaceApi } from "../../utils/contract";

const sliderData = [
  {
    title: "Cyber Punk Ape",
    // This must match your real on-chain tokenId
    id: 3,
    name: "Trishir Legend",
    collection: "Dope Apes",
    // Match on-chain example price (0.0001 ETH)
    price: "0.0001 ETH",
    like: 248,
    image: images.user1,
    nftImage: images.nft_image_1,
    time: {
      days: 3,
      hours: 10,
      minutes: 30,
      seconds: 40,
    },
  },
  {
    title: "Neon Skyline",
    id: 2,
    name: "John Legend",
    collection: "City Lights",
    price: "1.35 ETH",
    like: 312,
    image: images.user2,
    nftImage: images.nft_image_2,
    time: {
      days: 1,
      hours: 8,
      minutes: 12,
      seconds: 5,
    },
  },
  {
    title: "Galaxy Voyager",
    id: 4,
    name: "Joe Legend",
    collection: "Meta Space",
    price: "0.47 ETH",
    like: 189,
    image: images.user3,
    nftImage: images.nft_image_3,
    time: {
      days: 3,
      hours: 5,
      minutes: 45,
      seconds: 18,
    },
  },
  {
    title: "Dreamy Islands",
    id: 5,
    name: "Sera Legend",
    collection: "Paradise Drop",
    price: "2.05 ETH",
    like: 402,
    image: images.user4,
    nftImage: images.nft_1,
    time: {
      days: 0,
      hours: 22,
      minutes: 8,
      seconds: 52,
    },
  },
];

const BigNFTSlider = () => {
  const [index, setIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const currentSlide = sliderData[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % sliderData.length);
    setIsLiked(false);
  };

  const handlePrev = () => {
    setIndex((prev) =>
      prev === 0 ? sliderData.length - 1 : prev - 1
    );
    setIsLiked(false);
  };

  const toggleLike = () => {
    setIsLiked((prev) => !prev);
  };

  const handlePlaceBid = async () => {
    try {
      setIsBuying(true);
      // Parse price like "0.82 ETH" -> 0.82
      const priceEth = parseFloat(currentSlide.price);
      if (Number.isNaN(priceEth)) {
        alert("Invalid price format for this NFT.");
        return;
      }

      await marketplaceApi.buyMarketItem(currentSlide.id, priceEth);
      alert("Transaction sent! Check your wallet for confirmation.");
    } catch (error) {
      console.error("Buy failed:", error);
      alert("Transaction failed. Make sure tokenId and price match on-chain.");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <section className={styles.bigNFTSlider}>
      <div className={styles.bigNFTSlider_header}>
        <div className={styles.bigNFTSlider_header_left}>
          <AiFillFire className={styles.fireIcon} />
          <p>Trending auctions</p>
        </div>
        <div className={styles.bigNFTSlider_header_right}>
          <button
            type="button"
            aria-label="Previous NFT"
            className={styles.arrowBtn}
            onClick={handlePrev}
          >
            <TbArrowBigLeftLines />
          </button>
          <button
            type="button"
            aria-label="Next NFT"
            className={styles.arrowBtn}
            onClick={handleNext}
          >
            <TbArrowBigRightLines />
          </button>
        </div>
      </div>

      <div className={styles.bigNFTSlider_box}>
        {/* LEFT: info */}
        <div className={styles.bigNFTSlider_box_left}>
          <h2>{currentSlide.title}</h2>
          <div className={styles.creatorRow}>
            <div className={styles.creatorProfile}>
              <Image
                src={currentSlide.image}
                alt={currentSlide.name}
                width={50}
                height={50}
                className={styles.creatorImage}
              />
              <div>
                <span className={styles.creatorLabel}>
                  Creator
                </span>
                <p className={styles.creatorName}>
                  {currentSlide.name}
                  <MdVerified className={styles.verifiedIcon} />
                </p>
              </div>
            </div>
            <div className={styles.collection}>
              <span className={styles.creatorLabel}>
                Collection
              </span>
              <p>{currentSlide.collection}</p>
            </div>
          </div>

          <div className={styles.infoRow}>
            <div className={styles.priceBox}>
              <span>Current bid</span>
              <p>{currentSlide.price}</p>
              <small>~ $2,350.12</small>
            </div>
            <div className={styles.timerBox}>
              <div className={styles.timerHeader}>
                <MdTimer className={styles.timerIcon} />
                <span>Ends in</span>
              </div>
              <div className={styles.timerValues}>
                <div>
                  <p>{currentSlide.time.days}</p>
                  <small>Days</small>
                </div>
                <div>
                  <p>{currentSlide.time.hours}</p>
                  <small>Hours</small>
                </div>
                <div>
                  <p>{currentSlide.time.minutes}</p>
                  <small>Mins</small>
                </div>
                <div>
                  <p>{currentSlide.time.seconds}</p>
                  <small>Secs</small>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actionsRow}>
            <Button
              btnName={isBuying ? "Processing..." : "Place a bid"}
              handleClick={handlePlaceBid}
            />
            <Button btnName="View artwork" />

            <button
              type="button"
              className={styles.likeBtn}
              onClick={toggleLike}
              aria-label="Like NFT"
            >
              {isLiked ? (
                <AiFillHeart className={styles.likeIconFilled} />
              ) : (
                <AiOutlineHeart
                  className={styles.likeIconOutline}
                />
              )}
              <span>
                {currentSlide.like + (isLiked ? 1 : 0)} likes
              </span>
            </button>
          </div>

          <div className={styles.progressRow}>
            {sliderData.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.dot} ${
                  i === index ? styles.dotActive : ""
                }`}
                onClick={() => {
                  setIndex(i);
                  setIsLiked(false);
                }}
                aria-label={`View ${item.title}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: image */}
        <div className={styles.bigNFTSlider_box_right}>
          <div className={styles.nftCard}>
            <div className={styles.nftImageWrapper}>
              <Image
                src={currentSlide.nftImage}
                alt={currentSlide.title}
                width={500}
                height={500}
                className={styles.nftImage}
              />
            </div>
            <div className={styles.nftCard_footer}>
              <div>
                <p className={styles.nftTitle}>
                  {currentSlide.title}
                </p>
                <span className={styles.nftId}>
                  #{currentSlide.id.toString().padStart(4, "0")}
                </span>
              </div>
              <div className={styles.nftPriceSmall}>
                <span>Current bid</span>
                <p>{currentSlide.price}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BigNFTSlider;
