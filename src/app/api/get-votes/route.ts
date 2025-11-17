import { ethers, Contract, JsonRpcProvider } from "ethers";
import { NextResponse } from "next/server";
import abi from "@abis/BlockBallotSingle.json";

// We create a separate, read-only provider for getting tallies.
let contract: Contract;
let provider: JsonRpcProvider;

type TallyMap = {
  [key: string]: string;
};

const initReadOnlyEthers = () => {
  if (contract) {
    return;
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    console.error("Missing read-only environment variables for backend.");
    return;
  }

  provider = new JsonRpcProvider(rpcUrl);
  contract = new Contract(contractAddress, abi.abi, provider);
};

// This is the new App Router syntax for a GET request
export async function GET(request: Request) {
  try {
    initReadOnlyEthers();

    if (!contract) {
      return NextResponse.json(
        { message: "Backend not initialized. Check server logs." },
        { status: 500 }
      );
    }

    // Fetch the list of candidates
    const candidates: string[] = await contract.getCandidateList();
    const tallies: TallyMap = {};

    // Loop through each candidate to get their tally
    for (const name of candidates) {
      const tally: bigint = await contract.voteTally(name);
      tallies[name] = tally.toString(); // Convert BigInt to string
    }

    return NextResponse.json({ candidates, tallies });
    
  } catch (error: any) {
    console.error("Error fetching tally:", error);
    return NextResponse.json(
      { message: `Failed to fetch tally: ${error.message}` },
      { status: 500 }
    );
  }
}