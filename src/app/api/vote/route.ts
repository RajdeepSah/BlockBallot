import { ethers, Contract, JsonRpcProvider, Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import abi from "@abis/BlockBallotSingle.json";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, position, candidate, votes } = body;

    // Validate contract address
    if (!contractAddress || typeof contractAddress !== "string") {
      return NextResponse.json(
        { message: "Contract address is required." },
        { status: 400 }
      );
    }

    // Support both single vote (position + candidate) and array of votes
    let votesToProcess: Array<{ position: string; candidate: string }> = [];
    
    if (votes && Array.isArray(votes)) {
      // Array of votes format
      votesToProcess = votes;
    } else if (position && candidate) {
      // Single vote format (backward compatible)
      votesToProcess = [{ position, candidate }];
    } else {
      return NextResponse.json(
        { message: "Either 'position' and 'candidate' or 'votes' array is required." },
        { status: 400 }
      );
    }

    // Validate votes array
    if (votesToProcess.length === 0) {
      return NextResponse.json(
        { message: "At least one vote is required." },
        { status: 400 }
      );
    }

    for (const vote of votesToProcess) {
      if (!vote.position || typeof vote.position !== "string") {
        return NextResponse.json(
          { message: "Each vote must have a 'position' (string)." },
          { status: 400 }
        );
      }
      if (!vote.candidate || typeof vote.candidate !== "string") {
        return NextResponse.json(
          { message: "Each vote must have a 'candidate' (string)." },
          { status: 400 }
        );
      }
    }

    // Get environment variables
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.ORGANIZER_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
      return NextResponse.json(
        { message: "Missing environment variables: SEPOLIA_RPC_URL and ORGANIZER_PRIVATE_KEY must be set." },
        { status: 500 }
      );
    }

    // Create provider and wallet
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, abi.abi, wallet);

    // Process each vote as a separate transaction
    const transactionHashes: string[] = [];
    
    for (const vote of votesToProcess) {
      console.log(`Submitting vote for position "${vote.position}", candidate "${vote.candidate}"`);
      
      // Send the actual transaction to the blockchain
      const tx = await contract.vote(vote.position, vote.candidate);
      
      // Wait for the transaction to be mined (1 confirmation)
      await tx.wait(1);
      
      console.log(`Vote successful! Tx hash: ${tx.hash}`);
      transactionHashes.push(tx.hash);
    }

    // Return success response with transaction hash(es)
    return NextResponse.json({ 
      success: true, 
      txHash: transactionHashes.length === 1 ? transactionHashes[0] : transactionHashes,
      txHashes: transactionHashes,
      votesProcessed: votesToProcess.length
    });

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