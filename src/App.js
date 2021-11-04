import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';

// import toast from 'toasted-notes' 
// import 'toasted-notes/src/styles.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TWITTER_HANDLE2 = '7i7o';
const TWITTER_LINK2 = `https://twitter.com/${TWITTER_HANDLE2}`;
// const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-zbsmplbg6i';
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/colorful-crook-cartoons';
// const TOTAL_MINT_COUNT = 100;
const NETWORKS = {
  1: "Ethereum Mainnet",
  42: "Kovan Testnet",
  3: "Ropsten Testnet",
  4: "Rinkeby Testnet",
  5: "Goerli Testnet",
}

// Moved the contract address to the top for easy access.
// const CONTRACT_ADDRESS = "0x6adc1f9608f157236C55dF287d3Ad2c59E2bb593";
const CONTRACT_ADDRESS = "0x48A5A4b4C5942E0Be56858C10b8401eB0168346c";

const App = () => {

  // Just a state variable we use to store our user's public wallet. Don't forget to import useState.
  const [currentAccount, setCurrentAccount] = useState("");
  // Just a state variable we use to know when the App is mining.
  const [mining, setMining] = useState(false);

  const [totalNFTsMintedSoFar, setTotalNFTsMintedSoFar] = useState(0);
  const [maxNFTCount, setMaxNFTCount] = useState(50);


  // Gotta make sure this is async
  const checkIfWalletIsConnected = async () => {
    try {
      // First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      // User can have multiple authorized accounts, we grab the first one if its there!
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);

        // GET TOTAL MINTED NFT SO FAR

        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener()

      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Implementing connectWallet Here
  const connectWallet = async () => {
    try {
      // First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // Request access to account
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 

      // GET TOTAL MINTED NFT SO FAR

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener() 

    } catch (error) {
      console.log(error);
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        setTotalNFTsMintedSoFar((await connectedContract.getTotalNFTsMintedSoFar()).toNumber());
        setMaxNFTCount((await connectedContract.getMaxNFTCount()).toNumber());
        

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId, mintedSoFar) => {
          console.log(from, tokenId.toNumber());
          setTotalNFTsMintedSoFar(mintedSoFar.toNumber());
          alert(`Hey there! A new NFT has been minted! It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          // toast.notify(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`, { duration: null });
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

// Function to request minting of a NFT from the contract
const askContractToMintNft = async () => {
  //const CONTRACT_ADDRESS = "0xfcc697ebb913c435c5a48d6cd13c1c829ddad74a";
  //const CONTRACT_ADDRESS = "0x6adc1f9608f157236C55dF287d3Ad2c59E2bb593";
  
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT({ gasLimit: 2000000 });

        setMining(true);
        console.log("Mining...please wait.")
        await nftTxn.wait();
        
        setMining(false);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
}

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // Renders Connect Wallet Button
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  // We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
  const renderMintUI = () => (
    <button onClick={askContractToMintNft} disabled={!mining ? false : true} className="cta-button connect-wallet-button">
      {!mining ? "Mint NFT" : "Minting... Please wait" }  
    </button>
  )

  const openOpenSea = () => {
    window.open(OPENSEA_LINK, "_blank");
  }

  const renderOpenSeaUI = () => (
    <button onClick={openOpenSea} className="cta-button opensea-button">
      Browse the entire collection @ OpenSea
    </button>
  )

  const renderMintedSoFar = () => (
    <p className="footer-text">
      {totalNFTsMintedSoFar} of {maxNFTCount} minted so far
    </p>
  )

  const renderNetworkDetector = () => (
    <p className="footer-text">
      {window.ethereum.networkVersion == 4 ? `Mint your own! (on ${NETWORKS[window.ethereum.networkVersion]})` : `This only works on ${NETWORKS[4]}, please change your Network and refresh the page.`}
    </p>
  )

  /***** The result page to return *****/
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">
            <span className="gradient1">Colorful </span> 
            <span className="gradient2">Crook </span> 
            <span className="gradient3">Cartoons</span></p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? '' : (window.ethereum.networkVersion == 4 ? renderMintedSoFar() : '' )}
          {currentAccount === "" ? renderNotConnectedContainer() : ( window.ethereum.networkVersion == 4 ? ( totalNFTsMintedSoFar < maxNFTCount ? renderMintUI() : `Sorry! The entire collection has been minted.` ) : '' )}
          {currentAccount === "" ? "" : renderNetworkDetector()}
        </div>
        <div className="container">
          {renderOpenSeaUI()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <p className="footer-text">
            &nbsp;built on&nbsp;
            <a className="footer-text" href={TWITTER_LINK} target="_blank" rel="noreferrer">{`@${TWITTER_HANDLE}`}</a>
            &nbsp;by&nbsp;
            <a className="footer-text" href={TWITTER_LINK2} target="_blank" rel="noreferrer">{`@${TWITTER_HANDLE2}`}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
