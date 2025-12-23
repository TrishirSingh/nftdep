// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 public listingPrice = 0.025 ether;

    constructor() ERC721("MarketplaceNFT", "MNFT") Ownable(msg.sender) {}

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed owner,
        uint256 price,
        bool sold,
        string tokenURI
    );

    event MarketItemSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 timestamp
    );

    event MarketItemResold(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    /* ===================== MODIFIERS ===================== */

    modifier onlyTokenOwner(uint256 tokenId) {
        require(
            _ownerOf(tokenId) == msg.sender,
            "Caller is not token owner"
        );
        _;
    }

    /* ===================== UPDATE LISTING PRICE ===================== */

    function updateListingPrice(uint256 _listingPrice) public onlyOwner {
        listingPrice = _listingPrice;
    }

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    /* ===================== CREATE & LIST NFT ===================== */

    function createToken(string memory tokenURI, uint256 price)
        public
        payable
        returns (uint256)
    {
        require(price > 0, "Price must be greater than zero");
        require(msg.value == listingPrice, "Incorrect listing fee");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _createMarketItem(newTokenId, price);

        // Transfer listing fee to marketplace owner
        payable(owner()).transfer(msg.value);

        return newTokenId;
    }

    function _createMarketItem(uint256 tokenId, uint256 price) private {
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        _transfer(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false,
            tokenURI(tokenId)
        );
    }

    /* ===================== RESELL NFT ===================== */

    function resellToken(uint256 tokenId, uint256 price)
        public
        payable
        nonReentrant
        onlyTokenOwner(tokenId)
    {
        require(msg.value == listingPrice, "Incorrect listing fee");
        require(price > 0, "Price must be greater than zero");

        MarketItem storage item = idToMarketItem[tokenId];
        require(item.sold, "Item must be sold before reselling");

        item.sold = false;
        item.price = price;
        item.seller = payable(msg.sender);
        item.owner = payable(address(this));

        if (_itemsSold.current() > 0) {
            _itemsSold.decrement();
        }

        _transfer(msg.sender, address(this), tokenId);

        // Transfer listing fee to marketplace owner
        payable(owner()).transfer(msg.value);

        emit MarketItemResold(
            tokenId,
            msg.sender,
            price,
            block.timestamp
        );
    }

    /* ===================== BUY NFT ===================== */

    function createMarketSale(uint256 tokenId) 
        public 
        payable 
        nonReentrant 
    {
        MarketItem storage item = idToMarketItem[tokenId];

        require(
            _ownerOf(tokenId) != address(0),
            "Token does not exist"
        );
        require(!item.sold, "Item already sold");
        require(msg.value == item.price, "Incorrect price");
        require(item.seller != address(0), "Item not for sale");

        address payable seller = item.seller;

        // Update state before external calls (CEI pattern)
        item.owner = payable(msg.sender);
        item.sold = true;
        item.seller = payable(address(0));
        _itemsSold.increment();

        // Transfer NFT to buyer
        _transfer(address(this), msg.sender, tokenId);

        // Seller receives full sale price (listing fee was already paid upfront)
        seller.transfer(msg.value);

        emit MarketItemSold(
            tokenId,
            seller,
            msg.sender,
            item.price,
            block.timestamp
        );
    }

    /* ===================== VIEW FUNCTIONS ===================== */

    function fetchMarketItems()
        public
        view
        returns (MarketItem[] memory)
    {
        uint256 itemCount = _tokenIds.current();
        uint256 unsoldCount = itemCount - _itemsSold.current();

        MarketItem[] memory items = new MarketItem[](unsoldCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= itemCount; i++) {
            if (!idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }

        return items;
    }

    function fetchMyNFTs()
        public
        view
        returns (MarketItem[] memory)
    {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        return items;
    }

    function fetchItemsCreated()
        public
        view
        returns (MarketItem[] memory)
    {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        return items;
    }

    function getTokenInfo(uint256 tokenId)
        public
        view
        returns (
            uint256,
            address,
            address,
            uint256,
            bool,
            string memory
        )
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Token does not exist"
        );
        MarketItem memory item = idToMarketItem[tokenId];

        return (
            item.tokenId,
            item.seller,
            item.owner,
            item.price,
            item.sold,
            tokenURI(tokenId)
        );
    }

    function tokenExists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getTokenOwner(uint256 tokenId) public view returns (address) {
        require(
            _ownerOf(tokenId) != address(0),
            "Token does not exist"
        );
        return ownerOf(tokenId);
    }
}
