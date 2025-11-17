import { ethers, Contract, JsonRpcProvider, Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import abi from "@abis/BlockBallotSingle.json";

let contract: Contract;

const initEthers = () => {
  if (contract) {
    return;
  }

  // TEMPORARY hardcoded values for development
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.ORGANIZER_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    console.error("Missing environment variables for backend.");
    return;
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  contract = new Contract(contractAddress, abi.abi, signer);
};

export async function POST(request: NextRequest) {
  try {
    initEthers();

    if (!contract) {
      return NextResponse.json(
        { message: "Backend not initialized. Check server logs." },
        { status: 500 }
      );
    }

    // Get the candidate name from the request body
    // This is the new way to get the body in App Router
    const { candidate } = await request.json();

    if (!candidate || typeof candidate !== "string") {
      return NextResponse.json(
        { message: "Candidate name (string) is required." },
        { status: 400 }
      );
    }

    // Send the actual transaction to the blockchain
    console.log(`Submitting vote for: ${candidate}`);
    const tx = await contract.vote(candidate);

    // Wait for the transaction to be mined (1 confirmation)
    await tx.wait(1);

    console.log(`Vote successful! Tx hash: ${tx.hash}`);
    // Send a success response back to the frontend
    return NextResponse.json({ success: true, txHash: tx.hash });

  } catch (error: any) {
    console.error("Error during vote:", error);

    let errorMessage = "An unknown error occurred.";
    if (error.reason) {
      errorMessage = error.reason; // This is the 'require' message from the contract
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}