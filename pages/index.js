import { useState } from 'react'
import { ethers } from 'ethers'
import CounterAbi from '../CounterAbi.json'
import { Biconomy } from "@biconomy/mexa";
import styles from "../styles/Home.module.css"


const counterAddress = "0xdD1d6640788F4277a85a42CC76C1200bd1166978";

function App() {
  const [count, setCount] = useState(0);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  async function connectAndGetCount() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract =  new ethers.Contract(counterAddress, CounterAbi, provider)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      setAddress(walletAddress);
      try{
        const data = await contract.currentCount();
        setCount(data.toNumber())
      } catch(error) {
        console.log({error})
      }
    }
  }

  async function increment() {
    if (!address) return
    if (typeof window.ethereum !== 'undefined') {
      const biconomy = new Biconomy(
        window.ethereum,
        {
          apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
          debug: true,
          contractAddresses: [counterAddress]
        }
      );
      const provider = await biconomy.provider;

      const contractInstance = new ethers.Contract(
        counterAddress,
        CounterAbi,
        biconomy.ethersProvider
      );
      await biconomy.init();

      const { data } = await contractInstance.populateTransaction.incrementCount()

      let txParams = {
        data: data,
        to: counterAddress,
        from: address,
        signatureType: "EIP712_SIGN",
      };

      try {
        await provider.send("eth_sendTransaction", [txParams]);
        biconomy.on("txHashGenerated", (data) => {
          setMessage(`Transaction is processing with hash ${data.hash}`)
        });
        biconomy.on("txMined", (data) => {
          setCount(count + 1)
          setMessage(`Transaction has completed with hash ${data.hash}`)
        });
      } catch (error) {
        console.log(error)
      }
    }
    }

  return (
    <div className={styles.container}>
      <h1>Gasless Counter</h1>
      <div className={styles.card}>
        <p>{message}</p>
        {
          address ? (
          <button onClick={() => increment()}>
          Count is {count}
        </button>
        ):(      
        <button onClick={() => connectAndGetCount()}>
          Connect
        </button>
        )
        }
        <p>
          All counts are recorded on the Polygon Blockchain
        </p>
      </div>
      <p className={styles.docs}>
      <a href="https://docs.biconomy.io/" target="_blank" rel="noreferrer">
      Click here to learn more about Biconomy and building Gasless Transactions
        </a>
      </p>
    </div>
  )
}

export default App
